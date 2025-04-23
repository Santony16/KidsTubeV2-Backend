const express = require("express");
const router = express.Router();
const { 
    registerUser, 
    loginUser, 
    verifyAdminPin, 
    verifyEmail, 
    verifySmsCode,
    googleAuth,
    completeGoogleProfile
} = require("../controllers/userController");

// Routes for the users
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/verify-pin", verifyAdminPin);
router.post("/verify-sms", verifySmsCode);
router.get("/verify-email/:token", verifyEmail);
router.post("/google-auth", googleAuth);
router.post("/complete-google-profile", completeGoogleProfile);

module.exports = router;