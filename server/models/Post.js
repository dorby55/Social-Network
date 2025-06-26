const mongoose = require("mongoose");
const PostSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
  },
  text: {
    type: String,
    required: false,
    maxlength: 1000,
    default: "",
  },
  mediaType: {
    type: String,
    enum: ["none", "image", "video"],
    default: "none",
  },
  mediaUrl: {
    type: String,
    default: "",
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  comments: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      text: {
        type: String,
        required: true,
        maxlength: 500,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  editedAt: {
    type: Date,
    default: null,
  },
});

module.exports = mongoose.model("Post", PostSchema);
