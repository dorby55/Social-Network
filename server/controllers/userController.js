// server/controllers/userController.js
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

// @route   POST api/users
// @desc    Register user
// @access  Public
exports.registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password } = req.body;

  try {
    // Check if user already exists
    let userByEmail = await User.findOne({ email });
    if (userByEmail) {
      return res.status(400).json({ msg: "Email already in use" });
    }

    let userByUsername = await User.findOne({ username });
    if (userByUsername) {
      return res.status(400).json({ msg: "Username already taken" });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    // Create JWT payload
    const payload = {
      user: {
        id: user.id,
      },
    };

    // Sign token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// @route   POST api/auth
// @desc    Authenticate user & get token (Login)
// @access  Public
exports.loginUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // Create JWT payload
    const payload = {
      user: {
        id: user.id,
      },
    };

    // Sign token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// @route   GET api/users/me
// @desc    Get current user profile
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// @route   GET api/users/:id
// @desc    Get user by ID
// @access  Private
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "User not found" });
    }
    res.status(500).send("Server error");
  }
};

// @route   PUT api/users/:id
// @desc    Update user profile
// @access  Private
exports.updateUser = async (req, res) => {
  const { bio, profilePicture } = req.body;

  // Only allow users to update their own profile
  if (req.user.id !== req.params.id) {
    return res.status(401).json({ msg: "Not authorized" });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Update fields
    if (bio !== undefined) user.bio = bio;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;

    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

exports.uploadProfilePicture = async (req, res) => {
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({ msg: "No file uploaded" });
    }

    // Only use the filename part for the URL (no need for full path)
    const fileUrl = `/uploads/${req.file.filename}`;

    // Update the user's profile
    const user = await User.findById(req.user.id);
    user.profilePicture = fileUrl;
    await user.save();

    res.json({
      success: true,
      profilePicture: fileUrl,
      user: user,
    });
  } catch (err) {
    console.error("Error uploading profile picture:", err);
    res.status(500).send("Server error");
  }
};

exports.deleteProfilePicture = async (req, res) => {
  try {
    // Find the user
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Check if there's a profile picture to delete
    if (!user.profilePicture) {
      return res.status(400).json({ msg: "No profile picture to delete" });
    }

    // If the profile picture is stored on the server, delete the file
    // This is optional and depends on your implementation
    const fs = require("fs");
    const path = require("path");

    // Extract the filename from the URL
    // This assumes your profilePicture URLs are in the format: /uploads/filename.jpg
    if (user.profilePicture && user.profilePicture.startsWith("/uploads/")) {
      const filename = user.profilePicture.split("/").pop();
      const filePath = path.join(
        __dirname,
        "..",
        "..",
        "client",
        "public",
        "uploads",
        filename
      );

      // Check if the file exists before trying to delete it
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted file: ${filePath}`);
      }
    }

    // Reset the profile picture in the database
    user.profilePicture = "";
    await user.save();

    res.json({
      success: true,
      msg: "Profile picture deleted successfully",
      user: user,
    });
  } catch (err) {
    console.error("Error deleting profile picture:", err);
    res.status(500).send("Server error");
  }
};

// @route   DELETE api/users/:id
// @desc    Delete user
// @access  Private
exports.deleteUser = async (req, res) => {
  // Only allow users to delete their own profile or admins to delete any
  if (req.user.id !== req.params.id) {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser.isAdmin) {
      return res.status(401).json({ msg: "Not authorized" });
    }
  }

  try {
    await User.findByIdAndDelete(req.params.id);
    // Note: In a real application, you would also delete all associated data (posts, comments, etc.)
    res.json({ msg: "User deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// @route   GET api/users/search
// @desc    Search users by criteria
// @access  Private
exports.searchUsers = async (req, res) => {
  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({ msg: "Search term required" });
    }

    // Search for users by username (case-insensitive)
    const users = await User.find({
      username: { $regex: username, $options: "i" },
    })
      .select("username profilePicture bio")
      .limit(20); // Limit to 20 results for performance

    res.json(users);
  } catch (err) {
    console.error("User search error:", err.message);
    res.status(500).send("Server error");
  }
};

// @route   POST api/users/friends/:id
// @desc    Add a friend
// @access  Private
exports.addFriend = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const friend = await User.findById(req.params.id);

    if (!friend) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Check if already a friend
    if (user.friends.includes(req.params.id)) {
      return res.status(400).json({ msg: "Already friends" });
    }

    // Add to friends
    user.friends.push(req.params.id);
    friend.friends.push(req.user.id);

    await user.save();
    await friend.save();

    res.json(user.friends);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// @route   DELETE api/users/friends/:id
// @desc    Remove a friend
// @access  Private
exports.removeFriend = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const friend = await User.findById(req.params.id);

    if (!friend) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Check if actually a friend
    if (!user.friends.includes(req.params.id)) {
      return res.status(400).json({ msg: "Not friends" });
    }

    // Remove from friends
    user.friends = user.friends.filter((id) => id.toString() !== req.params.id);
    friend.friends = friend.friends.filter(
      (id) => id.toString() !== req.user.id
    );

    await user.save();
    await friend.save();

    res.json(user.friends);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// @route   POST api/users/friend-requests/:id
// @desc    Send friend request
// @access  Private
exports.sendFriendRequest = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Check if already friends
    if (targetUser.friends.includes(req.user.id)) {
      return res.status(400).json({ msg: "Already friends" });
    }

    // Check if request already sent
    const alreadySent = targetUser.friendRequests.some(
      (request) => request.user.toString() === req.user.id
    );

    if (alreadySent) {
      return res.status(400).json({ msg: "Friend request already sent" });
    }

    // Add to friend requests
    targetUser.friendRequests.push({ user: req.user.id });
    await targetUser.save();

    res.json({ msg: "Friend request sent" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// @route   POST api/users/friend-requests/:id/accept
// @desc    Accept friend request
// @access  Private
exports.acceptFriendRequest = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const requestingUser = await User.findById(req.params.id);

    if (!requestingUser) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Check if request exists
    const requestIndex = currentUser.friendRequests.findIndex(
      (request) => request.user.toString() === req.params.id
    );

    if (requestIndex === -1) {
      return res.status(404).json({ msg: "Friend request not found" });
    }

    // Remove from friend requests
    currentUser.friendRequests.splice(requestIndex, 1);

    // Add to friends for both users
    currentUser.friends.push(req.params.id);
    requestingUser.friends.push(req.user.id);

    await currentUser.save();
    await requestingUser.save();

    res.json({ msg: "Friend request accepted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// @route   POST api/users/friend-requests/:id/reject
// @desc    Reject friend request
// @access  Private
exports.rejectFriendRequest = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);

    // Check if request exists
    const requestIndex = currentUser.friendRequests.findIndex(
      (request) => request.user.toString() === req.params.id
    );

    if (requestIndex === -1) {
      return res.status(404).json({ msg: "Friend request not found" });
    }

    // Remove from friend requests
    currentUser.friendRequests.splice(requestIndex, 1);
    await currentUser.save();

    res.json({ msg: "Friend request rejected" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// @route   GET api/users/friend-requests
// @desc    Get current user's friend requests
// @access  Private
exports.getFriendRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate(
      "friendRequests.user",
      ["username", "profilePicture", "bio"]
    );

    res.json(user.friendRequests);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};
