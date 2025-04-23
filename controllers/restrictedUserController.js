const RestrictedUser = require("../models/RestrictedUser");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// get all restricted users
const getRestrictedUsers = async (req, res) => {
  try {
    const { parentUserId } = req.query;
    
    // If parentUserId is provided, filter by that ID
    const query = parentUserId ? { parentUser: parentUserId } : {};
    
    const users = await RestrictedUser.find(query);
    
    // Don't send PIN in the response
    const safeUsers = users.map(user => ({
      _id: user._id,
      name: user.name,
      avatar: user.avatar,
      parentUser: user.parentUser
    }));
    
    res.status(200).json(safeUsers);
  } catch (error) {
    console.error("Error fetching restricted users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// get restricted user by id
const getRestrictedUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const { parentUserId } = req.query;
    
    const user = await RestrictedUser.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Verify this user belongs to the parent user if parentUserId is provided
    if (parentUserId && user.parentUser.toString() !== parentUserId) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Don't send PIN in the response
    const safeUser = {
      _id: user._id,
      name: user.name,
      avatar: user.avatar,
      parentUser: user.parentUser
    };
    
    res.status(200).json(safeUser);
  } catch (error) {
    console.error("Error fetching restricted user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Create a new restricted user
const createRestrictedUser = async (req, res) => {
  try {
    const { name, pin, avatar, parentUserId } = req.body;
    
    if (!name || !pin) {
      return res.status(400).json({ error: "Name and PIN are required" });
    }
    
    if (pin.length !== 6 || !/^\d+$/.test(pin)) {
      return res.status(400).json({ error: "PIN must be 6 digits" });
    }
    
    let parentUser;
    if (parentUserId) {
      parentUser = await User.findById(parentUserId);
    } else {
      // Fallback
      parentUser = await User.findOne();
    }
    
    if (!parentUser) {
      return res.status(404).json({ error: "Parent user not found" });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(pin, salt);
    
    const newUser = new RestrictedUser({
      name,
      pin: hashedPin,
      avatar: avatar || "avatar1.png",
      parentUser: parentUser._id
    });
    
    await newUser.save();
    
    res.status(201).json({ 
      message: "Restricted user created successfully",
      userId: newUser._id
    });
  } catch (error) {
    console.error("Error creating restricted user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// update restricted user
const updateRestrictedUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, pin, avatar } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }
    
    if (pin && (pin.length !== 6 || !/^\d+$/.test(pin))) {
      return res.status(400).json({ error: "PIN must be 6 digits" });
    }
    
    const updateData = { name, avatar };
    
    // only update the PIN if it's provided
    if (pin) {
      const salt = await bcrypt.genSalt(10);
      updateData.pin = await bcrypt.hash(pin, salt);
    }
    
    const updatedUser = await RestrictedUser.findByIdAndUpdate(
      userId, 
      updateData, 
      { new: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.status(200).json({ 
      message: "User updated successfully",
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        avatar: updatedUser.avatar
      }
    });
  } catch (error) {
    console.error("Error updating restricted user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// drop restricted user
const deleteRestrictedUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const deletedUser = await RestrictedUser.findByIdAndDelete(userId);
    
    if (!deletedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting restricted user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Verify the PIN for a restricted user
const verifyRestrictedUserPin = async (req, res) => {
  try {
    const { userId, pin } = req.body;
    
    if (!userId || !pin) {
      return res.status(400).json({ error: "User ID and PIN are required" });
    }
    
    console.log(`Attempting to verify PIN for user: ${userId}`);
    console.log(`PIN provided: ${pin}`);
    
    const user = await RestrictedUser.findById(userId);
    
    if (!user) {
      console.log("User not found");
      return res.status(404).json({ error: "User not found" });
    }
    
    console.log(`User found: ${user.name}`);
    console.log(`Stored PIN hash: ${user.pin}`);
    
    // Compare the plain text PIN with the hashed PIN
    const isMatch = await bcrypt.compare(pin, user.pin);
    console.log(`PIN match result: ${isMatch}`);
    
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid PIN" });
    }
    
    res.status(200).json({ 
      message: "PIN verified successfully",
      userId: user._id,
      name: user.name
    });
  } catch (error) {
    console.error("Error verifying PIN:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getRestrictedUsers,
  getRestrictedUserById,
  createRestrictedUser,
  updateRestrictedUser,
  deleteRestrictedUser,
  verifyRestrictedUserPin
};
