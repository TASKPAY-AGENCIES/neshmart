const express = require('express');
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/seller/stats - metrics for the seller dashboard
router.get('/stats', requireAuth, async (req, res, next) => {
  try {
    const sellerId = req.user.id;

    const [activeListings, soldCount, escrowBalance, pendingPayouts, totalRevenue] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM products WHERE seller_id = $1 AND status = 'ACTIVE'", [sellerId]),
      pool.query("SELECT COUNT(*) FROM products WHERE seller_id = $1 AND status = 'SOLD'", [sellerId]),
      pool.query("SELECT COALESCE(SUM(amount),0) AS total FROM transactions WHERE seller_id = $1 AND escrow_status = 'HELD_IN_ESCROW'", [sellerId]),
      pool.query("SELECT COUNT(*) FROM transactions WHERE seller_id = $1 AND escrow_status = 'HELD_IN_ESCROW'", [sellerId]),
      pool.query("SELECT COALESCE(SUM(seller_payout),0) AS total FROM transactions WHERE seller_id = $1 AND escrow_status = 'RELEASED'", [sellerId]),
    ]);

    res.json({
      activeListings: parseInt(activeListings.rows[0].count, 10),
      productsSold: parseInt(soldCount.rows[0].count, 10),
      escrowBalance: parseFloat(escrowBalance.rows[0].total),
      pendingPayouts: parseInt(pendingPayouts.rows[0].count, 10),
      totalRevenue: parseFloat(totalRevenue.rows[0].total),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
