const Message = require("../models/Message");
const User = require("../models/User");
const { validationResult } = require("express-validator");

exports.sendMessage = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { receiver, content } = req.body;
    const receiverUser = await User.findById(receiver);
    if (!receiverUser) {
      return res.status(404).json({ msg: "User not found" });
    }

    const roomId = [req.user.id, receiver].sort().join("_");
    const newMessage = new Message({
      sender: req.user.id,
      receiver,
      content,
      room: roomId,
      isRead: false,
    });

    const message = await newMessage.save();
    await message.populate("sender", ["username", "profilePicture"]);
    await message.populate("receiver", ["username", "profilePicture"]);

    const io = req.app.get("io");
    if (io) {
      io.to(roomId).emit("receive_message", message);
      io.emit("message_notification", message);
    }

    res.json(message);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

exports.getConversation = async (req, res) => {
  try {
    const roomId = [req.user.id, req.params.userId].sort().join("_");
    const messages = await Message.find({ room: roomId })
      .populate("sender", ["username", "profilePicture"])
      .populate("receiver", ["username", "profilePicture"])
      .sort({ createdAt: 1 });

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

exports.getAllConversations = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.user.id }, { receiver: req.user.id }],
    })
      .populate("sender", ["username", "profilePicture"])
      .populate("receiver", ["username", "profilePicture"])
      .sort({ createdAt: -1 });

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

    for (const userId in conversations) {
      const unreadCount = await Message.countDocuments({
        sender: userId,
        receiver: req.user.id,
        isRead: false,
      });

      conversations[userId].unreadCount = unreadCount;
    }

    const conversationList = Object.values(conversations).sort(
      (a, b) => b.createdAt - a.createdAt
    );

    res.json(conversationList);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ msg: "Message not found" });
    }

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

exports.markAsRead = async (req, res) => {
  try {
    const roomId = [req.user.id, req.params.userId].sort().join("_");

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
