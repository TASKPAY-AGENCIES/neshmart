const pool = require('../config/db');
const { stkPush } = require('../utils/daraja');

const PHONE_REGEX = /^2547[0-9]{8}$/;

// POST /api/mpesa/stkpush  { productId, phone }
// Buyer initiates payment for a product. Creates a PENDING transaction
// and asks Safaricom to prompt the buyer's phone for PIN entry.
async function initiateStkPush(req, res, next) {
  const client = await pool.connect();
  try {
    const { productId, phone } = req.body;

    if (!productId || !phone) {
      return res.status(400).json({ error: 'productId and phone are required' });
    }
    if (!PHONE_REGEX.test(phone)) {
      return res.status(400).json({ error: 'Phone must be in format 2547XXXXXXXX' });
    }

    const productResult = await client.query(
      "SELECT * FROM products WHERE id = $1 AND status = 'ACTIVE'",
      [productId]
    );
    const product = productResult.rows[0];
    if (!product) return res.status(404).json({ error: 'Product not available' });
    if (product.seller_id === req.user.id) {
      return res.status(400).json({ error: 'You cannot buy your own listing' });
    }

    await client.query('BEGIN');

    const txResult = await client.query(
      `INSERT INTO transactions (buyer_id, seller_id, product_id, amount, payment_status, escrow_status)
       VALUES ($1, $2, $3, $4, 'PENDING', 'AWAITING_PAYMENT') RETURNING *`,
      [req.user.id, product.seller_id, product.id, product.price]
    );
    const transaction = txResult.rows[0];

    // Call Safaricom Daraja STK Push
    const darajaResponse = await stkPush({
      phone,
      amount: product.price,
      accountReference: `NESH-${product.id.slice(0, 8)}`,
      transactionDesc: product.title,
    });

    await client.query(
      `INSERT INTO mpesa_transactions
        (transaction_id, merchant_request_id, checkout_request_id, phone, amount, transaction_type)
       VALUES ($1, $2, $3, $4, $5, 'STK')`,
      [transaction.id, darajaResponse.MerchantRequestID, darajaResponse.CheckoutRequestID, phone, product.price]
    );

    await client.query('COMMIT');

    res.status(202).json({
      message: 'STK Push sent. Enter your M-Pesa PIN on your phone to complete payment.',
      transactionId: transaction.id,
      checkoutRequestId: darajaResponse.CheckoutRequestID,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    // Surface Daraja's own error message if present
    const darajaError = err.response?.data?.errorMessage;
    next(darajaError ? Object.assign(new Error(darajaError), { status: 502 }) : err);
  } finally {
    client.release();
  }
}

// POST /api/mpesa/callback - Safaricom posts the result of the STK push here.
// This endpoint must stay publicly reachable (no auth) since Safaricom calls it directly.
async function stkCallback(req, res, next) {
  try {
    const callback = req.body?.Body?.stkCallback;
    if (!callback) {
      return res.status(400).json({ ResultCode: 1, ResultDesc: 'Invalid callback payload' });
    }

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callback;

    const mpesaTxResult = await pool.query(
      'SELECT * FROM mpesa_transactions WHERE checkout_request_id = $1',
      [CheckoutRequestID]
    );
    const mpesaTx = mpesaTxResult.rows[0];

    // Always acknowledge Safaricom even if we can't find a match, so they stop retrying
    if (!mpesaTx) {
      console.warn('Received callback for unknown CheckoutRequestID:', CheckoutRequestID);
      return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    let mpesaReceiptNumber = null;
    if (ResultCode === 0 && CallbackMetadata?.Item) {
      const items = CallbackMetadata.Item;
      const receiptItem = items.find((i) => i.Name === 'MpesaReceiptNumber');
      mpesaReceiptNumber = receiptItem?.Value || null;
    }

    await pool.query(
      `UPDATE mpesa_transactions
       SET result_code = $1, result_desc = $2, mpesa_receipt_number = $3
       WHERE checkout_request_id = $4`,
      [ResultCode, ResultDesc, mpesaReceiptNumber, CheckoutRequestID]
    );

    if (ResultCode === 0) {
      // Payment succeeded -> hold funds in escrow, reserve the product
      const txUpdate = await pool.query(
        `UPDATE transactions
         SET payment_status = 'SUCCESS', escrow_status = 'HELD_IN_ESCROW', updated_at = now()
         WHERE id = $1 RETURNING *`,
        [mpesaTx.transaction_id]
      );
      const transaction = txUpdate.rows[0];

      await pool.query(
        `UPDATE products
         SET quantity = GREATEST(quantity - 1, 0),
             status = CASE WHEN quantity - 1 <= 0 THEN 'SOLD' ELSE status END
         WHERE id = $1`,
        [transaction.product_id]
      );
      await pool.query(
        `INSERT INTO escrow_logs (transaction_id, action, notes) VALUES ($1, 'HELD', 'Payment confirmed via STK Push')`,
        [transaction.id]
      );
      await pool.query(
        `INSERT INTO notifications (user_id, title, body) VALUES ($1, $2, $3)`,
        [transaction.seller_id, 'Item reserved!', 'A buyer has paid for your item. Funds are held in escrow until they confirm delivery.']
      );
    } else {
      // Payment failed or was cancelled by the user
      await pool.query(
        `UPDATE transactions SET payment_status = 'FAILED' WHERE id = $1`,
        [mpesaTx.transaction_id]
      );
    }

    // Safaricom expects this exact acknowledgement shape
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err) {
    next(err);
  }
}

// GET /api/mpesa/status/:transactionId - frontend polls this while waiting for the callback
async function checkStatus(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT t.payment_status, t.escrow_status, m.result_desc
       FROM transactions t
       LEFT JOIN mpesa_transactions m ON m.transaction_id = t.id AND m.transaction_type = 'STK'
       WHERE t.id = $1`,
      [req.params.transactionId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Transaction not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { initiateStkPush, stkCallback, checkStatus };
