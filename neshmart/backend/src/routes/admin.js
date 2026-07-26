const express = require('express');
const {
  platformStats, listUsers, setUserBanStatus,
  listAllProducts, moderateProduct,
  listTransactions, listReports, updateReportStatus,
} = require('../controllers/adminController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get('/stats', platformStats);

router.get('/users', listUsers);
router.put('/users/:id/ban', setUserBanStatus);

router.get('/products', listAllProducts);
router.put('/products/:id/moderate', moderateProduct);

router.get('/transactions', listTransactions);

router.get('/reports', listReports);
router.put('/reports/:id', updateReportStatus);

module.exports = router;
