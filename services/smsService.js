const twilio = require('twilio');
const crypto = require('crypto');

// In-memory store for verification codes
const verificationCodes = new Map();

/**
 * Generate a random 6-digit verification code
 */
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Store a verification code for a user
 * @param {string} userId - The user's ID
 * @param {string} code - The verification code
 * @param {number} expiresIn - Expiry time in seconds (default: 10 minutes)
 */
const storeVerificationCode = (userId, code, expiresIn = 600) => {
  // Store code with expiration timestamp
  verificationCodes.set(userId, {
    code,
    expiresAt: Date.now() + (expiresIn * 1000)
  });
  
  console.log(`Verification code ${code} stored for user ${userId}`);
};

/**
 * Verify a code for a user
 * @param {string} userId - The user's ID
 * @param {string} code - The verification code to check
 * @returns {boolean} True if valid, false otherwise
 */
const verifyCode = (userId, code) => {
  const storedData = verificationCodes.get(userId);
  
  // Check if code exists and is still valid
  if (!storedData) {
    console.log(`No verification code found for user ${userId}`);
    return false;
  }
  
  if (Date.now() > storedData.expiresAt) {
    console.log(`Verification code for user ${userId} has expired`);
    verificationCodes.delete(userId); // Clean up expired code
    return false;
  }
  
  // Check if codes match
  const isValid = storedData.code === code;
  
  if (isValid) {
    console.log(`Verification code for user ${userId} is valid`);
    verificationCodes.delete(userId); // Remove code after successful verification
  } else {
    console.log(`Invalid verification code for user ${userId}`);
  }
  
  return isValid;
};

/**
 * Format phone number for international calling
 * @param {string} phoneNumber - The phone number to format
 * @returns {string} Formatted phone number
 */
const formatPhoneNumber = (phoneNumber) => {
  // Remove all non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // If the number already has a country code (starts with +)
  if (phoneNumber.startsWith('+')) {
    return phoneNumber;
  }
  
  // If the number starts with a country code without +
  if (digitsOnly.startsWith('1') && digitsOnly.length >= 11) {
    return `+${digitsOnly}`;
  }
  
  // For Costa Rica numbers (may need 506 prefix)
  if (digitsOnly.length === 8) {
    return `+506${digitsOnly}`;
  }
  
  // Default: assume it needs +506 if it's 8 digits
  if (digitsOnly.length >= 8 && digitsOnly.length <= 10) {
    return `+506${digitsOnly}`;
  }
  
  // For any other case, just add + if not present
  if (!digitsOnly.startsWith('+')) {
    return `+${digitsOnly}`;
  }
  
  return phoneNumber;
};

/**
 * Send SMS verification code
 * @param {string} phoneNumber - The recipient's phone number
 * @param {string} userId - The user's ID
 * @returns {Promise<boolean>} True if sent successfully, false otherwise
 */
const sendSmsVerificationCode = async (phoneNumber, userId) => {
  try {
    // Generate verification code
    const code = generateVerificationCode();
    
    // Store the code
    storeVerificationCode(userId, code);
    
    // Format phone number properly for Twilio
    const formattedPhoneNumber = formatPhoneNumber(phoneNumber);
    
    console.log(`Preparing to send SMS to ${formattedPhoneNumber} with code ${code}`);
    
    // Load environment variables
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
    
    // Validate all Twilio credentials are present
    if (!accountSid || !authToken || !twilioPhone) {
      console.error('Missing Twilio credentials:', {
        accountSid: accountSid ? 'Present' : 'Missing',
        authToken: authToken ? 'Present' : 'Missing',
        twilioPhone: twilioPhone || 'Missing'
      });
      throw new Error('Twilio credentials not properly configured');
    }
    
    // Debug Twilio credentials
    console.log(`Using Twilio credentials: SID: ${accountSid.substring(0, 5)}... | Phone: ${twilioPhone}`);
    
    // Check for simulation mode - but we'll ignore it since user wants real SMS
    if (process.env.SMS_SIMULATION_MODE === 'true') {
      console.log('WARNING: SMS_SIMULATION_MODE is set to true, but we will send real SMS as requested');
    }
    
    // Initialize Twilio client
    const client = twilio(accountSid, authToken);
    
    // Prepare message options
    const messageOptions = {
      body: `Your KidsTube verification code is: ${code}`,
      from: twilioPhone,
      to: formattedPhoneNumber
    };
    
    console.log('Sending message with options:', {
      body: `Your KidsTube verification code is: ${code}`,
      from: twilioPhone,
      to: formattedPhoneNumber
    });
    
    // Send SMS via Twilio
    const message = await client.messages.create(messageOptions);
    
    console.log(`Verification SMS sent successfully to ${formattedPhoneNumber} with SID: ${message.sid}`);
    return true;
  } catch (error) {
    console.error('Error sending SMS:', error);
    
    // Additional debugging for common Twilio errors
    if (error.code === 21608) {
      console.error('This number is unverified. For trial accounts, verify the number first at https://www.twilio.com/console/phone-numbers/verified');
    } else if (error.code === 20003 || error.code === 20404) {
      console.error('Authentication error - check your Twilio credentials');
    } else if (error.code === 21211) {
      console.error('Invalid phone number format. Please check the phone number.');
    } else if (error.code === 21612 || error.code === 21408) {
      console.error('The Twilio phone number cannot send SMS to this destination.');
    }
    
    throw error;
  }
};

module.exports = {
  generateVerificationCode,
  storeVerificationCode,
  verifyCode,
  sendSmsVerificationCode,
  formatPhoneNumber
};
