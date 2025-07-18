const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const GroupSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  isPrivate: {
    type: Boolean,
    default: false,
  },
  admin: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  members: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      joinedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  pendingRequests: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      requestedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  invitations: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      invitedAt: {
        type: Date,
        default: Date.now,
      },
      invitedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Group", GroupSchema);
