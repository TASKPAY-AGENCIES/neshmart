const express = require('express');
const { releaseFunds, b2cResult, b2cTimeout, myEscrowTransactions } = require('../controllers/escrowController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/release', requireAuth, releaseFunds);
router.get('/mine', requireAuth, myEscrowTransactions);
// Safaricom webhooks - no auth
router.post('/b2c/result', b2cResult);
router.post('/b2c/timeout', b2cTimeout);

module.exports = router;
