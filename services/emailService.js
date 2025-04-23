const { MailerSend, EmailParams, Sender, Recipient } = require('mailersend');

// Getting the API key from environment variables
const apiKey = process.env.MAILERSEND_API_KEY;

// Initialize MailerSend with the API key
const mailerSend = new MailerSend({
  apiKey: apiKey,
});

/**
 * Function to send a verification email using MailerSend
 * @param {string} to - Email address of the recipient
 * @param {string} token - Token of the user to verify
 * @param {string} firstName - Name of the user to personalize the email
 * @returns {Promise<boolean>} - True if email sent successfully, false otherwise
 */
const sendVerificationEmail = async (to, token, firstName) => {
  // If no API key is configured, log error and return false
  if (!apiKey) {
    console.error('Cannot send email: MAILERSEND_API_KEY is not configured');
    return false;
  }

  try {
    console.log('Setting up email with MailerSend using token:', apiKey.substring(0, 10) + '...');
    
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const verificationUrl = `${baseUrl}/api/users/verify-email/${token}`;

    // Define sender - use env values if available
    const fromEmail = process.env.MAILERSEND_FROM_EMAIL || "no-reply@test-nrw7gymmv8og2k8e.mlsender.net";
    const fromName = process.env.MAILERSEND_FROM_NAME || "KidsTube";
    
    // Debug log
    console.log(`Sending email from: ${fromEmail} (${fromName}) to: ${to}`);
    
    // Use correct structure for sender and recipient
    const sender = new Sender(fromEmail, fromName);
    const recipients = [new Recipient(to, firstName)];

    // Email content in English
    const htmlContent = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="background-color: #4d56f8; padding: 20px; color: white; text-align: center;">
          <h1>KidsTube</h1>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd;">
          <h2>Hello, ${firstName}!</h2>
          <p>Thank you for registering with KidsTube. To complete your registration and activate your account, please click the button below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #4d56f8; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Verify My Email</a>
          </div>
          
          <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
          <p style="word-break: break-all; font-size: 14px;"><a href="${verificationUrl}">${verificationUrl}</a></p>
          
          <p>This verification link will expire in 24 hours.</p>
          
          <p>If you didn't request this verification, you can ignore this email.</p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #777; font-size: 12px;">
          <p>© ${new Date().getFullYear()} KidsTube. All rights reserved.</p>
        </div>
      </div>
    `;

    // Plain text content in English
    const textContent = `
      Hello ${firstName},
      
      Thank you for registering with KidsTube. To complete your registration and activate your account, 
      please visit the following link:
      
      ${verificationUrl}
      
      This verification link will expire in 24 hours.
      
      If you didn't request this verification, you can ignore this email.
      
      © ${new Date().getFullYear()} KidsTube. All rights reserved.
    `;

    // Configure the email parameters
    const emailParams = new EmailParams()
      .setFrom(sender)
      .setTo(recipients)
      .setSubject("Verify your KidsTube Account")
      .setHtml(htmlContent)
      .setText(textContent);

    // Log to indicate email sending process
    console.log('Sending email...');
    
    // Send the email
    const response = await mailerSend.email.send(emailParams);
    console.log('Email sent successfully:', response);
    return true;
  } catch (error) {
    console.error('Error sending email with MailerSend:', error);
    
    // Show more detailed error information if available
    if (error.response) {
      console.error('Error details:', {
        statusCode: error.response.statusCode,
        body: error.response.body
      });
    }
    
    return false;
  }
};

module.exports = {
  sendVerificationEmail
};
