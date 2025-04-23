const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const restrictedUserSchema = new Schema({
  name: { 
    type: String, 
    required: true 
  },
  pin: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    default: "avatar1.png"
  },
  parentUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

module.exports = mongoose.model("RestrictedUser", restrictedUserSchema);
