const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { 
  generateVerificationCode, 
  storeVerificationCode, 
  verifyCode, 
  sendSmsVerificationCode 
} = require('../services/smsService');

/**
 * Send verification SMS controller function
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const sendVerification = async (req, res) => {
  try {
    const { userId, phoneNumber } = req.body;
    
    if (!userId || !phoneNumber) {
      return res.status(400).json({ error: 'User ID and phone number are required' });
    }
    
    // Find user to verify they exist
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if Twilio is properly configured
    if (process.env.SMS_SIMULATION_MODE !== 'true' && 
        (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER)) {
      console.error('SMS Configuration Error:', {
        ACCOUNT_SID: !!process.env.TWILIO_ACCOUNT_SID,
        AUTH_TOKEN: !!process.env.TWILIO_AUTH_TOKEN,
        PHONE_NUMBER: !!process.env.TWILIO_PHONE_NUMBER,
        SIMULATION_MODE: process.env.SMS_SIMULATION_MODE
      });
      
      return res.status(500).json({
        error: 'SMS service configuration error',
        message: 'The server is not properly configured for SMS sending'
      });
    }
    
    // Send SMS
    try {
      await sendSmsVerificationCode(phoneNumber, userId);
      
      res.json({ 
        success: true, 
        message: 'Verification code sent successfully'
      });
    } catch (smsError) {
      console.error('SMS sending error:', smsError);
      
      res.status(500).json({ 
        error: 'Failed to send verification code',
        message: smsError.message || 'Please check your phone number or try again later.'
      });
    }
  } catch (error) {
    console.error('Error sending SMS:', error);
    res.status(500).json({ 
      error: 'Failed to send verification code',
      details: error.message
    });
  }
};

/**
 * Verify SMS code controller function
 */
const verifySmsCode = async (req, res) => {
  try {
    const { userId, code } = req.body;
    
    if (!userId || !code) {
      return res.status(400).json({ error: 'User ID and verification code are required' });
    }
    
    // Verify the code
    const isValid = verifyCode(userId, code);
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }
    
    // Find user to generate token
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }, 
      process.env.JWT_SECRET || 'kidstube-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      message: 'SMS verification successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        country: user.country
      }
    });
  } catch (error) {
    console.error('Error verifying SMS code:', error);
    res.status(500).json({ 
      error: 'Failed to verify SMS code',
      details: error.message
    });
  }
};

/**
 * Resend verification code controller function
 */
const resendCode = async (req, res) => {
  try {
    const { userId, phoneNumber } = req.body;
    
    if (!userId || !phoneNumber) {
      return res.status(400).json({ error: 'User ID and phone number are required' });
    }
    
    // Send new code
    const sent = await sendSmsVerificationCode(phoneNumber, userId);
    
    if (sent) {
      res.json({ 
        success: true, 
        message: 'Verification code resent successfully'
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to resend verification code',
        message: 'Please check your phone number or try again later.'
      });
    }
  } catch (error) {
    console.error('Error resending SMS:', error);
    res.status(500).json({ 
      error: 'Failed to resend verification code',
      details: error.message
    });
  }
};

module.exports = {
  sendVerification,
  verifySmsCode,
  resendCode
};
