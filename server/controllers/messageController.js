// server/controllers/messageController.js
const Message = require("../models/Message");
const User = require("../models/User");
const { validationResult } = require("express-validator");

// @route   POST api/messages
// @desc    Send a message
// @access  Private
exports.sendMessage = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { receiver, content } = req.body;

    // Check if receiver exists
    const receiverUser = await User.findById(receiver);
    if (!receiverUser) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Create room ID (sorted user IDs joined with underscore)
    const roomId = [req.user.id, receiver].sort().join("_");

    // Create new message
    const newMessage = new Message({
      sender: req.user.id,
      receiver,
      content,
      room: roomId,
    });

    const message = await newMessage.save();

    // Populate sender and receiver info
    await message.populate("sender", ["username", "profilePicture"]);
    await message.populate("receiver", ["username", "profilePicture"]);

    res.json(message);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// @route   GET api/messages/:userId
// @desc    Get conversation with a user
// @access  Private
exports.getConversation = async (req, res) => {
  try {
    // Create room ID (sorted user IDs joined with underscore)
    const roomId = [req.user.id, req.params.userId].sort().join("_");

    // Get messages from the conversation
    const messages = await Message.find({ room: roomId })
      .populate("sender", ["username", "profilePicture"])
      .populate("receiver", ["username", "profilePicture"])
      .sort({ createdAt: 1 });

    // Mark all messages as read if current user is the receiver
    await Message.updateMany(
      { room: roomId, receiver: req.user.id, isRead: false },
      { isRead: true }
    );

    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// @route   GET api/messages
// @desc    Get all user's conversations
// @access  Private
exports.getAllConversations = async (req, res) => {
  try {
    // Find all messages where the current user is sender or receiver
    const messages = await Message.find({
      $or: [{ sender: req.user.id }, { receiver: req.user.id }],
    })
      .populate("sender", ["username", "profilePicture"])
      .populate("receiver", ["username", "profilePicture"])
      .sort({ createdAt: -1 });

    // Group messages by conversation and get the latest message for each
    const conversations = {};

    messages.forEach((message) => {
      const otherUser =
        message.sender._id.toString() === req.user.id
          ? message.receiver._id.toString()
          : message.sender._id.toString();

      if (
        !conversations[otherUser] ||
        message.createdAt > conversations[otherUser].createdAt
      ) {
        conversations[otherUser] = {
          ...message.toObject(),
          otherUser:
            message.sender._id.toString() === req.user.id
              ? message.receiver
              : message.sender,
          unreadCount: 0,
        };
      }
    });

    // Count unread messages for each conversation
    for (const userId in conversations) {
      const unreadCount = await Message.countDocuments({
        sender: userId,
        receiver: req.user.id,
        isRead: false,
      });

      conversations[userId].unreadCount = unreadCount;
    }

    // Convert to array and sort by latest message
    const conversationList = Object.values(conversations).sort(
      (a, b) => b.createdAt - a.createdAt
    );

    res.json(conversationList);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// @route   DELETE api/messages/:id
// @desc    Delete a message
// @access  Private
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ msg: "Message not found" });
    }

    // Check if user is sender
    if (message.sender.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    await message.remove();
    res.json({ msg: "Message removed" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// @route   GET api/messages/unread
// @desc    Get count of unread messages
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.user.id,
      isRead: false,
    });

    res.json({ count });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// @route   PUT api/messages/read/:userId
// @desc    Mark all messages from a user as read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    // Create room ID (sorted user IDs joined with underscore)
    const roomId = [req.user.id, req.params.userId].sort().join("_");

    // Mark all messages as read if current user is the receiver
    await Message.updateMany(
      { room: roomId, receiver: req.user.id, isRead: false },
      { isRead: true }
    );

    res.json({ msg: "Messages marked as read" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};
