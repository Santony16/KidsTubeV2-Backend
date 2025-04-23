const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define the schema for the Playlist model
const playlistSchema = new Schema({
  name: { type: String, required: true },
  profiles: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'RestrictedUser' 
  }],
  videos: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Video' 
  }],
  parentUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

module.exports = mongoose.model("Playlist", playlistSchema);
