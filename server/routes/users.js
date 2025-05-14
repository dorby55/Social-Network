// server/routes/users.js
const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const auth = require("../middleware/auth");
const userController = require("../controllers/userController");
const { profileUpload } = require("../middleware/upload");
// @route   POST api/users
// @desc    Register user
// @access  Public
router.post(
  "/",
  [
    check("username", "Username is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check(
      "password",
      "Please enter a password with 6 or more characters"
    ).isLength({ min: 6 }),
  ],
  userController.registerUser
);

// @route   POST api/users/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  "/login",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists(),
  ],
  userController.loginUser
);

router.post(
  "/profile-picture",
  auth,
  profileUpload.single("profilePicture"),
  userController.uploadProfilePicture
);

router.delete("/profile-picture", auth, userController.deleteProfilePicture);

router.post("/friend-requests/:id", auth, userController.sendFriendRequest);
router.post(
  "/friend-requests/:id/accept",
  auth,
  userController.acceptFriendRequest
);
router.post(
  "/friend-requests/:id/reject",
  auth,
  userController.rejectFriendRequest
);
router.get("/friend-requests", auth, userController.getFriendRequests);

// @route   GET api/users/search
// @desc    Search users by criteria
// @access  Private
router.get("/search", auth, userController.searchUsers);

// @route   GET api/users/me
// @desc    Get current user profile
// @access  Private
router.get("/me", auth, userController.getMe);

// @route   GET api/users/:id
// @desc    Get user by ID
// @access  Private
router.get("/:id", auth, userController.getUserById);

// @route   PUT api/users/:id
// @desc    Update user profile
// @access  Private
router.put("/:id", auth, userController.updateUser);

// @route   DELETE api/users/:id
// @desc    Delete user
// @access  Private
router.delete("/:id", auth, userController.deleteUser);

// @route   POST api/users/friends/:id
// @desc    Add a friend
// @access  Private
router.post("/friends/:id", auth, userController.addFriend);

// @route   DELETE api/users/friends/:id
// @desc    Remove a friend
// @access  Private
router.delete("/friends/:id", auth, userController.removeFriend);

module.exports = router;
