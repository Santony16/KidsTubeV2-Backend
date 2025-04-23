const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const userSchema = new Schema({

  email: {
    type: String,
    required: true,
    unique: true,
    match: [/^\S+@\S+\.\S+$/, "Email is not valid."],
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  phone: {
    type: String,
    required: function() {
      // Only required if user status is not pending_completion
      return this.status !== 'pending_completion';
    },
    match: [/^\d{8,15}$/, "The phone number must be between 8 and 15 digits long."],
  },
  
  // Add country dial code field
  countryDialCode: {
    type: String,
    default: ''
  },
  
  pin: {
    type: String,
    required: function() {
      // Only required if user status is not pending_completion
      return this.status !== 'pending_completion';
    },
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  country: {
    type: String,
    default: "Unknown",
  },
  birthDate: {
    type: Date,
    required: function() {
      // Only required if user status is not pending_completion
      return this.status !== 'pending_completion';
    },
    validate: {
      validator: function (value) {
        if (!value && this.status === 'pending_completion') return true;
        const today = new Date();
        const minDate = new Date(today.setFullYear(today.getFullYear() - 18));
        return value <= minDate;
      },
      message: "You must be over 18 years old to register",
    },
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'pending_completion'],
    default: 'pending'
  },
  verificationToken: {
    type: String,
    default: null
  },
  googleId: {
    type: String,
    sparse: true,
    index: true
  }
});


module.exports = mongoose.model('User', userSchema);