const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User"); 
const crypto = require("crypto");
const { OAuth2Client } = require('google-auth-library');
const { sendVerificationEmail } = require("../services/emailService");
const { 
  generateVerificationCode, 
  storeVerificationCode, 
  verifyCode, 
  sendSmsVerificationCode 
} = require("../services/smsService");
const { JWT_SECRET } = require("../middleware/auth");
const { getDialCodeByCountry } = require('./countryController');

// Initialize the Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const registerUser = async (req, res) => {
    try {
        const { firstName, lastName, email, phone, password, confirmPassword, pin, birthDate, country, countryDialCode } = req.body;

        // verify if email already exist
        const existUser = await User.findOne({ email });
        if (existUser) {
            return res.status(400).json({ error: "El correo electrónico ya está en uso" });
        }

        //verify passwords is match
        if (password !== confirmPassword) {
            return res.status(400).json({ error: "Las contraseñas no coinciden" });
        }

        // Validate PIN format before hashing
        if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
            return res.status(400).json({ error: "El PIN debe tener exactamente 6 dígitos" });
        }

        const birthDateObj = new Date(birthDate);
        const age = new Date().getFullYear() - birthDateObj.getFullYear();
        if (age < 18) {
            return res.status(400).json({ error: "Debes tener al menos 18 años para registrarte" });
        }

        // hashed password before save
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // hashed pin
        const hashedPin = await bcrypt.hash(pin, salt);
        
        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        
        // New user with status 'pending' and verification token
        const newUser = new User({
            firstName,
            lastName,
            email,
            phone,
            countryDialCode, // Save the country dial code
            password: hashedPassword,
            pin: hashedPin,
            birthDate,
            country,
            status: 'pending',
            verificationToken
        });

        // save in db
        await newUser.save();
        
        // Intentar enviar el correo de verificación
        const emailSent = await sendVerificationEmail(
            email, 
            verificationToken, 
            firstName
        );

        // Return success message
        res.status(201).json({ 
            message: emailSent 
                ? "Usuario registrado correctamente. Por favor, revisa tu correo para verificar tu cuenta." 
                : "Usuario registrado, pero hubo un problema al enviar el correo de verificación. Contacta a soporte.",
            userId: newUser._id,
            emailSent
        });
        
    } catch (error) {
        console.error("Error al registrar usuario:", error);
        res.status(500).json({ error: error.message || "Error interno del servidor" });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // search user by email to validate if exist
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: "Invalid email or password" });
        }
        
        // Check if user's email is verified
        if (user.status === 'pending') {
            return res.status(401).json({ 
                error: "Email not verified. Please check your inbox for verification link.",
                isPending: true
            });
        }

        // compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid email or password" });
        }

        // Generate SMS verification code for 2FA
        const verificationCode = generateVerificationCode();
        storeVerificationCode(user._id.toString(), verificationCode);
        
        // Use the stored country dial code directly from the user object
        const dialCode = user.countryDialCode || await getDialCodeByCountry(user.country);
        console.log(`Using dial code ${dialCode} for SMS verification`);
        
        // Send SMS with verification code
        await sendSmsVerificationCode(user.phone, verificationCode, dialCode);

        // Return partial success with user ID for 2FA completion
        res.status(200).json({
            message: "First authentication step successful. Please enter the verification code sent to your phone.",
            userId: user._id,
            requiresVerification: true
        });
    } catch (error) {
        console.error("Error logging in:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Verify SMS code and generate JWT token
const verifySmsCode = async (req, res) => {
    try {
        const { userId, code } = req.body;
        
        if (!userId || !code) {
            return res.status(400).json({ error: "User ID and verification code are required" });
        }
        
        // Verify the code
        const isValid = verifyCode(userId, code);
        
        if (!isValid) {
            return res.status(401).json({ error: "Invalid or expired verification code" });
        }
        
        // Fetch user data for the response
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        // Create user object for token payload (exclude sensitive data)
        const userForToken = {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
        };
        
        // Generate JWT token
        const token = jwt.sign(
            userForToken, 
            JWT_SECRET, 
            { expiresIn: '24h' }
        );
        
        // Return user info without password
        const userInfo = {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            country: user.country
        };
        
        // Return success with user info and token
        res.status(200).json({
            message: "Authentication successful",
            user: userInfo,
            token: token
        });
    } catch (error) {
        console.error("Error verifying SMS code:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Verify email from verification link
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        
        // Find user with this verification token
        const user = await User.findOne({ verificationToken: token });
        
        if (!user) {
            return res.status(400).json({ error: "Invalid verification token" });
        }
        
        // Update user status and clear verification token
        user.status = 'active';
        user.verificationToken = null;
        await user.save();
        
        console.log(`User ${user.email} successfully verified`);
        
        // Redirect to frontend verification success page with updated port
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8081';
        res.redirect(`${frontendUrl}/verified.html?verified=true&email=${encodeURIComponent(user.email)}`);
    } catch (error) {
        console.error("Error verifying email:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// verify admin pin
const verifyAdminPin = async (req, res) => {
    try {
        const { pin, userId } = req.body;

        if (!pin) {
            return res.status(400).json({ error: "PIN is required" });
        }

        const user = userId ? await User.findById(userId) : await User.findOne();
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // compare the plain text PIN with the hashed PIN
        const isMatch = await bcrypt.compare(pin, user.pin);
        
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid PIN" });
        }

        // correct PIN
        res.status(200).json({ 
            message: "PIN verified successfully",
            userId: user._id
        });
    } catch (error) {
        console.error("Error verifying PIN:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Google authentication endpoint
const googleAuth = async (req, res) => {
    try {
        const { token } = req.body;
        
        // Verify the Google token
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        
        const payload = ticket.getPayload();
        
        // Check if user exists
        let user = await User.findOne({ email: payload.email });
        let isNewUser = false;
        
        if (user) {
            // User exists - check if this is a Google account or regular account
            if (!user.googleId) {
                // This is a regular account - update it with Google ID
                user.googleId = payload.sub;
                await user.save();
            }
        } else {
            // New user - create a temporary account
            isNewUser = true;
            
            // Split name into first and last name (best effort)
            const nameParts = payload.name.split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
            
            // Create a temporary user record
            user = new User({
                email: payload.email,
                firstName,
                lastName,
                googleId: payload.sub,
                password: await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10), // random password
                status: 'pending_completion' // Special status for Google users who need to complete profile
            });
            
            await user.save();
        }
        
        if (isNewUser) {
            // For new users, return info without token so they complete their profile
            return res.status(200).json({
                userId: user._id,
                isNewUser: true,
                message: "Please complete your profile information"
            });
        }
        
        // For existing users with complete profiles, create JWT token
        const userForToken = {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
        };
        
        const jwtToken = jwt.sign(
            userForToken, 
            JWT_SECRET, 
            { expiresIn: '24h' }
        );
        
        // Return user info without password
        const userInfo = {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            country: user.country
        };
        
        // Return success with user info and token
        res.status(200).json({
            message: "Google authentication successful",
            user: userInfo,
            token: jwtToken,
            isNewUser: false
        });
        
    } catch (error) {
        console.error("Google authentication error:", error);
        res.status(500).json({ error: "Failed to authenticate with Google" });
    }
};

// Complete profile after Google authentication
const completeGoogleProfile = async (req, res) => {
    try {
        const { userId, googleToken, phone, pin, birthDate, country } = req.body;
        
        // Verify Google token again for security
        const ticket = await googleClient.verifyIdToken({
            idToken: googleToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        
        const payload = ticket.getPayload();
        
        // Get the user
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        // Verify this is the same Google account
        if (user.googleId !== payload.sub) {
            return res.status(403).json({ error: "Invalid Google account" });
        }
        
        // Validate birthdate (must be 18+ years old)
        const birthDateObj = new Date(birthDate);
        const today = new Date();
        const age = today.getFullYear() - birthDateObj.getFullYear();
        if (age < 18) {
            return res.status(400).json({ error: "You must be at least 18 years old to register" });
        }
        
        // Hash the PIN
        const salt = await bcrypt.genSalt(10);
        const hashedPin = await bcrypt.hash(pin, salt);
        
        // Update user with additional info
        user.phone = phone;
        user.pin = hashedPin;
        user.birthDate = birthDateObj;
        user.country = country;
        user.status = 'active'; // Activate the account
        
        await user.save();
        
        // Generate JWT token
        const userForToken = {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
        };
        
        const token = jwt.sign(
            userForToken, 
            JWT_SECRET, 
            { expiresIn: '24h' }
        );
        
        // Return user info
        const userInfo = {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            country: user.country
        };
        
        res.status(200).json({
            message: "Profile completed successfully",
            token,
            userId: user._id,
            user: userInfo
        });
        
    } catch (error) {
        console.error("Error completing profile:", error);
        res.status(500).json({ error: "Failed to complete profile" });
    }
};

module.exports = { 
    registerUser, 
    loginUser, 
    verifyEmail, 
    verifyAdminPin, 
    verifySmsCode,
    googleAuth,
    completeGoogleProfile
};

