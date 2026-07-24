const express = require('express');
const { initiateStkPush, stkCallback, checkStatus } = require('../controllers/mpesaController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/stkpush', requireAuth, initiateStkPush);
// No auth - Safaricom calls this directly from their servers
router.post('/callback', stkCallback);
router.get('/status/:transactionId', requireAuth, checkStatus);

module.exports = router;
