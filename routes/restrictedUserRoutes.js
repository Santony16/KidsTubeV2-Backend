const express = require("express");
const router = express.Router();
const {
  getRestrictedUsers,
  getRestrictedUserById,
  createRestrictedUser,
  updateRestrictedUser,
  deleteRestrictedUser,
  verifyRestrictedUserPin
} = require("../controllers/restrictedUserController");

// Routes for the restricted users
router.get("/", getRestrictedUsers);
router.get("/:userId", getRestrictedUserById);
router.post("/", createRestrictedUser);
router.put("/:userId", updateRestrictedUser);
router.delete("/:userId", deleteRestrictedUser);
router.post("/verify-pin", verifyRestrictedUserPin);

module.exports = router;
