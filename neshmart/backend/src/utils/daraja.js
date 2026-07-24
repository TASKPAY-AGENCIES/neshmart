const axios = require('axios');

const BASE_URL = process.env.DARAJA_ENV === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';

let cachedToken = null;
let tokenExpiresAt = 0;

// OAuth token - cached until near expiry (Daraja tokens last 1hr)
async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const auth = Buffer.from(
    `${process.env.DARAJA_CONSUMER_KEY}:${process.env.DARAJA_CONSUMER_SECRET}`
  ).toString('base64');

  const { data } = await axios.get(
    `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` } }
  );

  cachedToken = data.access_token;
  // Refresh 60s before actual expiry as a safety margin
  tokenExpiresAt = Date.now() + (parseInt(data.expires_in, 10) - 60) * 1000;
  return cachedToken;
}

function timestampNow() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return (
    d.getFullYear().toString() + pad(d.getMonth() + 1) + pad(d.getDate()) +
    pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds())
  );
}

/**
 * Initiate STK Push (Lipa Na M-Pesa Online / M-Pesa Express)
 * @param {string} phone - format 2547XXXXXXXX
 * @param {number} amount
 * @param {string} accountReference - shown to payer, e.g. product title or order id
 * @param {string} transactionDesc
 */
async function stkPush({ phone, amount, accountReference, transactionDesc }) {
  const token = await getAccessToken();
  const timestamp = timestampNow();
  const password = Buffer.from(
    `${process.env.BUSINESS_SHORTCODE}${process.env.PASSKEY}${timestamp}`
  ).toString('base64');

  const payload = {
    BusinessShortCode: process.env.BUSINESS_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.round(amount),
    PartyA: phone,
    PartyB: process.env.BUSINESS_SHORTCODE,
    PhoneNumber: phone,
    CallBackURL: process.env.CALLBACK_URL,
    AccountReference: accountReference.slice(0, 12),
    TransactionDesc: transactionDesc.slice(0, 13),
  };

  const { data } = await axios.post(
    `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
    payload,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return data; // { MerchantRequestID, CheckoutRequestID, ResponseCode, ... }
}

/**
 * Trigger B2C payout to seller once escrow is released.
 * @param {string} phone - seller's phone, format 2547XXXXXXXX
 * @param {number} amount
 * @param {string} remarks
 * @param {string} occasion
 */
async function b2cPayout({ phone, amount, remarks, occasion }) {
  const token = await getAccessToken();

  const payload = {
    InitiatorName: process.env.B2C_INITIATOR_NAME,
    SecurityCredential: process.env.B2C_SECURITY_CREDENTIAL,
    CommandID: 'BusinessPayment',
    Amount: Math.round(amount),
    PartyA: process.env.B2C_SHORTCODE,
    PartyB: phone,
    Remarks: remarks || 'NESHMART seller payout',
    QueueTimeOutURL: process.env.B2C_QUEUE_TIMEOUT_URL,
    ResultURL: process.env.B2C_RESULT_URL,
    Occasion: occasion || 'NESHMART payout',
  };

  const { data } = await axios.post(
    `${BASE_URL}/mpesa/b2c/v1/paymentrequest`,
    payload,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return data; // { ConversationID, OriginatorConversationID, ResponseCode, ... }
}

module.exports = { getAccessToken, stkPush, b2cPayout };
