const pool = require('../config/db');

// GET /api/admin/stats — platform-wide overview
async function platformStats(req, res, next) {
  try {
    const [users, products, transactions, revenue, reports] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query("SELECT COUNT(*) FROM products WHERE status = 'ACTIVE'"),
      pool.query('SELECT COUNT(*) FROM transactions'),
      pool.query("SELECT COALESCE(SUM(platform_fee),0) AS total FROM transactions WHERE escrow_status = 'RELEASED'"),
      pool.query("SELECT COUNT(*) FROM reported_listings WHERE status = 'OPEN'"),
    ]);

    res.json({
      totalUsers: parseInt(users.rows[0].count, 10),
      activeListings: parseInt(products.rows[0].count, 10),
      totalTransactions: parseInt(transactions.rows[0].count, 10),
      totalCommission: parseFloat(revenue.rows[0].total),
      openReports: parseInt(reports.rows[0].count, 10),
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/users?search=
async function listUsers(req, res, next) {
  try {
    const { search } = req.query;
    const values = [];
    let where = '';
    if (search) {
      values.push(`%${search}%`);
      where = `WHERE full_name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1`;
    }
    const result = await pool.query(
      `SELECT id, full_name, email, phone, is_verified_student, role, is_banned, created_at
       FROM users ${where} ORDER BY created_at DESC LIMIT 200`,
      values
    );
    res.json({ users: result.rows });
  } catch (err) {
    next(err);
  }
}

// PUT /api/admin/users/:id/ban  { banned: true|false }
async function setUserBanStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { banned } = req.body;
    if (id === req.user.id) {
      return res.status(400).json({ error: 'You cannot ban your own account' });
    }
    const result = await pool.query(
      'UPDATE users SET is_banned = $1 WHERE id = $2 RETURNING id, full_name, is_banned',
      [!!banned, id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/products?status=
async function listAllProducts(req, res, next) {
  try {
    const { status } = req.query;
    const values = [];
    let where = '';
    if (status) {
      values.push(status);
      where = `WHERE p.status = $1`;
    }
    const result = await pool.query(
      `SELECT p.id, p.title, p.price, p.status, p.campus_location, p.created_at,
              u.full_name AS seller_name, u.email AS seller_email
       FROM products p JOIN users u ON u.id = p.seller_id
       ${where} ORDER BY p.created_at DESC LIMIT 200`,
      values
    );
    res.json({ products: result.rows });
  } catch (err) {
    next(err);
  }
}

// PUT /api/admin/products/:id/moderate  { status: 'REMOVED' | 'ACTIVE' }
async function moderateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['ACTIVE', 'PAUSED', 'REMOVED', 'SOLD'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const result = await pool.query(
      'UPDATE products SET status = $1, updated_at = now() WHERE id = $2 RETURNING id, title, status',
      [status, id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Product not found' });
    res.json({ product: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/transactions — escrow/transaction monitoring
async function listTransactions(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT t.id, t.amount, t.platform_fee, t.seller_payout, t.payment_status, t.escrow_status, t.created_at,
              p.title AS product_title,
              b.full_name AS buyer_name, s.full_name AS seller_name
       FROM transactions t
       JOIN products p ON p.id = t.product_id
       JOIN users b ON b.id = t.buyer_id
       JOIN users s ON s.id = t.seller_id
       ORDER BY t.created_at DESC LIMIT 200`
    );
    res.json({ transactions: result.rows });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/reports — reported listings
async function listReports(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT r.id, r.reason, r.status, r.created_at,
              p.id AS product_id, p.title AS product_title,
              u.full_name AS reporter_name
       FROM reported_listings r
       JOIN products p ON p.id = r.product_id
       JOIN users u ON u.id = r.reporter_id
       ORDER BY r.created_at DESC LIMIT 200`
    );
    res.json({ reports: result.rows });
  } catch (err) {
    next(err);
  }
}

// PUT /api/admin/reports/:id  { status: 'REVIEWED' | 'DISMISSED' }
async function updateReportStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['OPEN', 'REVIEWED', 'DISMISSED'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const result = await pool.query(
      'UPDATE reported_listings SET status = $1 WHERE id = $2 RETURNING id, status',
      [status, id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Report not found' });
    res.json({ report: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  platformStats, listUsers, setUserBanStatus,
  listAllProducts, moderateProduct,
  listTransactions, listReports, updateReportStatus,
};
