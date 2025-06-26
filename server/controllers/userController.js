const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

exports.registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password } = req.body;

  try {
    let userByEmail = await User.findOne({ email });
    if (userByEmail) {
      return res.status(400).json({ msg: "Email already in use" });
    }

    let userByUsername = await User.findOne({ username });
    if (userByUsername) {
      return res.status(400).json({ msg: "Username already taken" });
    }

    const user = new User({
      username,
      email,
      password,
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = {
      user: {
        id: user.id,
      },
    };

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

exports.loginUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const payload = {
      user: {
        id: user.id,
      },
    };

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

exports.updateUser = async (req, res) => {
  const { bio, profilePicture } = req.body;

  if (req.user.id !== req.params.id) {
    return res.status(401).json({ msg: "Not authorized" });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

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
    if (!req.file) {
      return res.status(400).json({ msg: "No file uploaded" });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
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
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (!user.profilePicture) {
      return res.status(400).json({ msg: "No profile picture to delete" });
    }

    const fs = require("fs");
    const path = require("path");

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

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted file: ${filePath}`);
      }
    }

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

exports.deleteUser = async (req, res) => {
  if (req.user.id !== req.params.id) {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser.isAdmin) {
      return res.status(401).json({ msg: "Not authorized" });
    }
  }

  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: "User deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({ msg: "Search term required" });
    }

    const users = await User.find({
      username: { $regex: username, $options: "i" },
    })
      .select("username profilePicture bio")
      .limit(20);

    res.json(users);
  } catch (err) {
    console.error("User search error:", err.message);
    res.status(500).send("Server error");
  }
};

exports.addFriend = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const friend = await User.findById(req.params.id);

    if (!friend) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (user.friends.includes(req.params.id)) {
      return res.status(400).json({ msg: "Already friends" });
    }

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

exports.removeFriend = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const friend = await User.findById(req.params.id);

    if (!friend) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (!user.friends.includes(req.params.id)) {
      return res.status(400).json({ msg: "Not friends" });
    }

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

exports.sendFriendRequest = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (targetUser.friends.includes(req.user.id)) {
      return res.status(400).json({ msg: "Already friends" });
    }

    const alreadySent = targetUser.friendRequests.some(
      (request) => request.user.toString() === req.user.id
    );

    if (alreadySent) {
      return res.status(400).json({ msg: "Friend request already sent" });
    }

    targetUser.friendRequests.push({ user: req.user.id });
    await targetUser.save();

    res.json({ msg: "Friend request sent" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

exports.acceptFriendRequest = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const requestingUser = await User.findById(req.params.id);

    if (!requestingUser) {
      return res.status(404).json({ msg: "User not found" });
    }

    const requestIndex = currentUser.friendRequests.findIndex(
      (request) => request.user.toString() === req.params.id
    );

    if (requestIndex === -1) {
      return res.status(404).json({ msg: "Friend request not found" });
    }

    currentUser.friendRequests.splice(requestIndex, 1);
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

exports.rejectFriendRequest = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const requestIndex = currentUser.friendRequests.findIndex(
      (request) => request.user.toString() === req.params.id
    );

    if (requestIndex === -1) {
      return res.status(404).json({ msg: "Friend request not found" });
    }
    currentUser.friendRequests.splice(requestIndex, 1);
    await currentUser.save();

    res.json({ msg: "Friend request rejected" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

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
