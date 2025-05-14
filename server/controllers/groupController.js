// server/controllers/groupController.js
const Group = require("../models/Group");
const User = require("../models/User");
const { validationResult } = require("express-validator");

// @route   POST api/groups
// @desc    Create a new group
// @access  Private
exports.createGroup = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, description, isPrivate } = req.body;

    // Create new group
    const newGroup = new Group({
      name,
      description,
      isPrivate: isPrivate || false,
      admin: req.user.id,
      members: [{ user: req.user.id }],
    });

    const group = await newGroup.save();

    // Add group to user's groups
    await User.findByIdAndUpdate(req.user.id, { $push: { groups: group._id } });

    res.json(group);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// @route   GET api/groups
// @desc    Get all public groups
// @access  Private
exports.getAllGroups = async (req, res) => {
  try {
    const groups = await Group.find({ isPrivate: false })
      .populate("admin", ["username", "profilePicture"])
      .sort({ createdAt: -1 });
    res.json(groups);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// @route   GET api/groups/my
// @desc    Get user's groups
// @access  Private
exports.getUserGroups = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: "groups",
      populate: {
        path: "admin",
        select: "username profilePicture",
      },
    });
    res.json(user.groups);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// @route   GET api/groups/:id
// @desc    Get group by ID
// @access  Private
exports.getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate("admin", ["username", "profilePicture"])
      .populate("members.user", ["username", "profilePicture"]);

    if (!group) {
      return res.status(404).json({ msg: "Group not found" });
    }

    // Allow access if:
    // 1. The group is public, OR
    // 2. Current user is the admin, OR
    // 3. Current user is a member
    const isAdmin = group.admin._id.toString() === req.user.id;
    const isMember = group.members.some(
      (member) => member.user._id.toString() === req.user.id
    );

    if (group.isPrivate && !isAdmin && !isMember) {
      // For private groups, return limited information
      return res.json({
        _id: group._id,
        name: group.name,
        isPrivate: true,
        admin: group.admin,
        members: [], // Don't expose member details for private groups
        restricted: true, // Flag to indicate restricted access
        message: "This is a private group you don't have access to",
      });
    }

    // Return full group details for public groups or when user has access
    res.json(group);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Group not found" });
    }
    res.status(500).send("Server error");
  }
};

// @route   PUT api/groups/:id
// @desc    Update a group
// @access  Private
exports.updateGroup = async (req, res) => {
  try {
    const { name, description, isPrivate } = req.body;
    let group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ msg: "Group not found" });
    }

    // Check if user is admin
    if (group.admin.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    // Update fields
    if (name) group.name = name;
    if (description) group.description = description;
    if (isPrivate !== undefined) group.isPrivate = isPrivate;

    await group.save();
    res.json(group);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// @route   DELETE api/groups/:id
// @desc    Delete a group
// @access  Private
exports.deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ msg: "Group not found" });
    }

    // Check if user is admin
    if (group.admin.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    // Remove group from all members' groups array
    for (const member of group.members) {
      await User.findByIdAndUpdate(member.user, {
        $pull: { groups: group._id },
      });
    }

    await group.remove();
    res.json({ msg: "Group removed" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// @route   POST api/groups/:id/join
// @desc    Request to join a group
// @access  Private
exports.joinGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ msg: "Group not found" });
    }

    // Check if user is already a member
    const isMember = group.members.some(
      (member) => member.user.toString() === req.user.id
    );

    if (isMember) {
      return res.status(400).json({ msg: "Already a member" });
    }

    // Check if user already has a pending request
    const hasPendingRequest = group.pendingRequests.some(
      (request) => request.user.toString() === req.user.id
    );

    if (hasPendingRequest) {
      return res.status(400).json({ msg: "Request already pending" });
    }

    if (group.isPrivate) {
      // Add to pending requests
      group.pendingRequests.push({ user: req.user.id });
      await group.save();
      res.json({ msg: "Join request sent" });
    } else {
      // Add to members directly for public groups
      group.members.push({ user: req.user.id });
      await group.save();

      // Add group to user's groups
      await User.findByIdAndUpdate(req.user.id, {
        $push: { groups: group._id },
      });

      res.json({ msg: "Joined group successfully" });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// @route   POST api/groups/:id/approve/:userId
// @desc    Approve a join request
// @access  Private
exports.approveJoinRequest = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ msg: "Group not found" });
    }

    // Check if user is admin
    if (group.admin.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    // Find the request
    const requestIndex = group.pendingRequests.findIndex(
      (request) => request.user.toString() === req.params.userId
    );

    if (requestIndex === -1) {
      return res.status(404).json({ msg: "Request not found" });
    }

    // Add to members
    group.members.push({ user: req.params.userId });

    // Remove from pending requests
    group.pendingRequests.splice(requestIndex, 1);

    await group.save();

    // Add group to user's groups
    await User.findByIdAndUpdate(req.params.userId, {
      $push: { groups: group._id },
    });

    res.json({ msg: "User approved" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// @route   POST api/groups/:id/reject/:userId
// @desc    Reject a join request
// @access  Private
exports.rejectJoinRequest = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ msg: "Group not found" });
    }

    // Check if user is admin
    if (group.admin.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    // Find the request
    const requestIndex = group.pendingRequests.findIndex(
      (request) => request.user.toString() === req.params.userId
    );

    if (requestIndex === -1) {
      return res.status(404).json({ msg: "Request not found" });
    }

    // Remove from pending requests
    group.pendingRequests.splice(requestIndex, 1);

    await group.save();

    res.json({ msg: "Request rejected" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// @route   POST api/groups/:id/leave
// @desc    Leave a group
// @access  Private
exports.leaveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ msg: "Group not found" });
    }

    // Check if user is a member
    const memberIndex = group.members.findIndex(
      (member) => member.user.toString() === req.user.id
    );

    if (memberIndex === -1) {
      return res.status(400).json({ msg: "Not a member" });
    }

    // Admin cannot leave without assigning a new admin
    if (group.admin.toString() === req.user.id) {
      return res
        .status(400)
        .json({ msg: "Admin cannot leave. Transfer admin role first." });
    }

    // Remove from members
    group.members.splice(memberIndex, 1);

    await group.save();

    // Remove group from user's groups
    await User.findByIdAndUpdate(req.user.id, { $pull: { groups: group._id } });

    res.json({ msg: "Left group" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// @route   GET api/groups/search
// @desc    Search groups by criteria
// @access  Private
exports.searchGroups = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({ msg: "Search term required" });
    }

    // Search for groups by name (case-insensitive)
    // Only return public groups or groups user is a member of
    const groups = await Group.find({
      name: { $regex: name, $options: "i" },
      $or: [
        { isPrivate: false },
        { members: { $elemMatch: { user: req.user.id } } },
      ],
    })
      .populate("admin", "username profilePicture")
      .limit(20);

    res.json(groups);
  } catch (err) {
    console.error("Group search error:", err.message);
    res.status(500).send("Server error");
  }
};
