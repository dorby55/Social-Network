const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const auth = require("../middleware/auth");
const userController = require("../controllers/userController");
const { profileUpload } = require("../middleware/upload");

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

router.get("/search", auth, userController.searchUsers);

router.get("/me", auth, userController.getMe);

router.get("/:id", auth, userController.getUserById);

router.put("/:id", auth, userController.updateUser);

router.delete("/:id", auth, userController.deleteUser);

router.post("/friends/:id", auth, userController.addFriend);

router.delete("/friends/:id", auth, userController.removeFriend);

module.exports = router;
