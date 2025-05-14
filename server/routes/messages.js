// server/routes/messages.js
const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const auth = require("../middleware/auth");
const messageController = require("../controllers/messageController");

// @route   POST api/messages
// @desc    Send a message
// @access  Private
router.post(
  "/",
  [
    auth,
    [
      check("receiver", "Receiver is required").not().isEmpty(),
      check("content", "Content is required").not().isEmpty(),
    ],
  ],
  messageController.sendMessage
);

// @route   GET api/messages/:userId
// @desc    Get conversation with a user
// @access  Private
router.get("/:userId", auth, messageController.getConversation);

// @route   GET api/messages
// @desc    Get all user's conversations
// @access  Private
router.get("/", auth, messageController.getAllConversations);

// @route   DELETE api/messages/:id
// @desc    Delete a message
// @access  Private
router.delete("/:id", auth, messageController.deleteMessage);

// @route   GET api/messages/unread
// @desc    Get count of unread messages
// @access  Private
router.get("/unread", auth, messageController.getUnreadCount);

// @route   PUT api/messages/read/:userId
// @desc    Mark all messages from a user as read
// @access  Private
router.put("/read/:userId", auth, messageController.markAsRead);

module.exports = router;
