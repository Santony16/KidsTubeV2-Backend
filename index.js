require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require('cors');

// Connect to MongoDB
console.log('Connecting to MongoDB using environment variables...');
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Check critical environment variables and set NON-SENSITIVE defaults
if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET not defined in .env, using insecure default');
  process.env.JWT_SECRET = 'development-jwt-secret-DO-NOT-USE-IN-PRODUCTION';
}

// URLs and application configurations 
if (!process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL = 'http://localhost:8081';
}
if (!process.env.BACKEND_URL) {
  process.env.BACKEND_URL = 'http://localhost:3001';
}

// Email service configuration
if (!process.env.MAILERSEND_API_KEY) {
  console.warn('WARNING: MailerSend variables not configured');
}

// Twilio configuration
if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
  console.warn('WARNING: Incomplete Twilio credentials. SMS will not work properly.');
  
}

// Log Twilio configuration (without showing full credentials)
console.log('Twilio Configuration:', {
  ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ? `${process.env.TWILIO_ACCOUNT_SID.substring(0, 5)}...` : 'Not set',
  AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ? 'Set (hidden)' : 'Not set',
  PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER ? 'Set' : 'Not set',
  SIMULATION_MODE: process.env.SMS_SIMULATION_MODE || 'false'
});

// parser for the request body (required for the POST and PUT methods)
app.use(bodyParser.json());

// Configure CORS with proper options
const corsOptions = {
  origin: ['http://localhost:8081', 'http://127.0.0.1:8081'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin', 
    'X-Requested-With', 
    'Content-Type', 
    'Accept', 
    'Authorization',
    'Cache-Control', 
    'Pragma',
    'Expires'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

// Apply CORS configuration
app.use(cors(corsOptions));

// Enable more verbose logging in development
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_ENV = 'development';
  console.log('Running in development mode');
  console.log('Running in development mode - all verification codes will be logged to console');
  
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });
}

// Routes
const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);

const restrictedUserRoutes = require("./routes/restrictedUserRoutes");
app.use("/api/users/restricted", restrictedUserRoutes);

const playlistRoutes = require("./routes/playlistRoutes");
app.use("/api/playlists", playlistRoutes);

const videoRoutes = require("./routes/videoRoutes");
app.use("/api/videos", videoRoutes);

const countryRoutes = require("./routes/countryRoutes");
app.use("/api/countries", countryRoutes);

const smsRoutes = require('./routes/smsRoutes');
app.use('/api/sms', smsRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`KidsTube API running on port ${PORT}!`));