const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const auth = require("../middleware/auth");
const messageController = require("../controllers/messageController");

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

router.get("/:userId", auth, messageController.getConversation);

router.get("/", auth, messageController.getAllConversations);

router.delete("/:id", auth, messageController.deleteMessage);

router.get("/unread", auth, messageController.getUnreadCount);

router.put("/read/:userId", auth, messageController.markAsRead);

module.exports = router;
