const pool = require('../config/db');
const { b2cPayout } = require('../utils/daraja');

const FEE_PERCENT = parseFloat(process.env.PLATFORM_FEE_PERCENT || '0.05');

// POST /api/escrow/release  { transactionId }
// Called by the BUYER once they've physically inspected and accepted the item.
async function releaseFunds(req, res, next) {
  try {
    const { transactionId } = req.body;
    if (!transactionId) return res.status(400).json({ error: 'transactionId is required' });

    const txResult = await pool.query(
      `SELECT t.*, u.phone AS seller_phone
       FROM transactions t
       JOIN users u ON u.id = t.seller_id
       WHERE t.id = $1`,
      [transactionId]
    );
    const transaction = txResult.rows[0];

    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
    if (transaction.buyer_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the buyer can release funds for this transaction' });
    }
    if (transaction.escrow_status !== 'HELD_IN_ESCROW') {
      return res.status(400).json({ error: `Cannot release funds - current status is ${transaction.escrow_status}` });
    }

    const platformFee = Math.round(transaction.amount * FEE_PERCENT * 100) / 100;
    const sellerPayout = Math.round((transaction.amount - platformFee) * 100) / 100;

    // Trigger the actual M-Pesa payout to the seller
    const payoutResponse = await b2cPayout({
      phone: transaction.seller_phone,
      amount: sellerPayout,
      remarks: `NESHMART payout for order ${transaction.id.slice(0, 8)}`,
      occasion: 'NESHMART sale',
    });

    await pool.query(
      `UPDATE transactions
       SET escrow_status = 'RELEASED', platform_fee = $1, seller_payout = $2, updated_at = now()
       WHERE id = $3`,
      [platformFee, sellerPayout, transaction.id]
    );

    await pool.query(
      `UPDATE products SET status = 'SOLD' WHERE id = $1`,
      [transaction.product_id]
    );

    await pool.query(
      `INSERT INTO mpesa_transactions
        (transaction_id, phone, amount, transaction_type, payout_reference)
       VALUES ($1, $2, $3, 'B2C', $4)`,
      [transaction.id, transaction.seller_phone, sellerPayout, payoutResponse.ConversationID]
    );

    await pool.query(
      `INSERT INTO escrow_logs (transaction_id, action, actor_id, notes)
       VALUES ($1, 'RELEASED', $2, 'Buyer confirmed delivery, payout initiated')`,
      [transaction.id, req.user.id]
    );

    await pool.query(
      `INSERT INTO notifications (user_id, title, body) VALUES ($1, $2, $3)`,
      [transaction.seller_id, 'Payout on the way!', `Buyer confirmed delivery. KES ${sellerPayout} is being sent to your M-Pesa.`]
    );

    res.json({
      message: 'Funds released. Payout has been sent to the seller.',
      platformFee,
      sellerPayout,
      conversationId: payoutResponse.ConversationID,
    });
  } catch (err) {
    const darajaError = err.response?.data?.errorMessage;
    next(darajaError ? Object.assign(new Error(darajaError), { status: 502 }) : err);
  }
}

// B2C result/timeout webhooks - Safaricom posts async confirmation of the payout itself
async function b2cResult(req, res) {
  console.log('B2C Result:', JSON.stringify(req.body));
  // In production: match on OriginatorConversationID/ConversationID and update
  // mpesa_transactions.result_code/result_desc for reconciliation & support tooling.
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
}

async function b2cTimeout(req, res) {
  console.warn('B2C Timeout:', JSON.stringify(req.body));
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
}

// GET /api/escrow/mine - buyer's escrow/purchase history
async function myEscrowTransactions(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT t.*, p.title, p.image_url, u.full_name AS seller_name, u.phone AS seller_phone
       FROM transactions t
       JOIN products p ON p.id = t.product_id
       JOIN users u ON u.id = t.seller_id
       WHERE t.buyer_id = $1
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );
    res.json({ transactions: result.rows });
  } catch (err) {
    next(err);
  }
}

module.exports = { releaseFunds, b2cResult, b2cTimeout, myEscrowTransactions };
