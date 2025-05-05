const express = require('express');
const router = express.Router();
const smsController = require('../controllers/smsController');

// POST /api/sms/send-verification - Send SMS verification code
router.post('/send-verification', smsController.sendVerification);

// POST /api/sms/verify-code - Verify SMS code
router.post('/verify-code', smsController.verifySmsCode);

// POST /api/sms/resend - Resend SMS verification code
router.post('/resend', smsController.resendCode);

module.exports = router;
