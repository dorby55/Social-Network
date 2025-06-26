const Group = require("../models/Group");
const User = require("../models/User");
const { validationResult } = require("express-validator");

exports.createGroup = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, description, isPrivate } = req.body;

    const newGroup = new Group({
      name,
      description,
      isPrivate: isPrivate || false,
      admin: req.user.id,
      members: [{ user: req.user.id }],
    });

    const group = await newGroup.save();

    await User.findByIdAndUpdate(req.user.id, { $push: { groups: group._id } });

    res.json(group);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

exports.getAllGroups = async (req, res) => {
  try {
    const groups = await Group.find({
      $or: [
        { isPrivate: false },
        { members: { $elemMatch: { user: req.user.id } } },
      ],
    })
      .populate("admin", ["username", "profilePicture"])
      .sort({ createdAt: -1 });

    res.json(groups);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

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

exports.getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate("admin", ["username", "profilePicture"])
      .populate("members.user", ["username", "profilePicture"])
      .populate("pendingRequests.user", ["username", "profilePicture"]);

    if (!group) {
      return res.status(404).json({ msg: "Group not found" });
    }

    const isAdmin = group.admin._id.toString() === req.user.id;
    const isMember = group.members.some(
      (member) => member.user._id.toString() === req.user.id
    );

    if (group.isPrivate && !isAdmin && !isMember) {
      return res.json({
        _id: group._id,
        name: group.name,
        isPrivate: true,
        admin: group.admin,
        members: [],
        restricted: true,
        message: "This is a private group you don't have access to",
      });
    }

    res.json(group);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Group not found" });
    }
    res.status(500).send("Server error");
  }
};

exports.updateGroup = async (req, res) => {
  try {
    const { name, description, isPrivate } = req.body;
    let group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ msg: "Group not found" });
    }

    if (group.admin.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }

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

exports.deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ msg: "Group not found" });
    }

    if (group.admin.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    for (const member of group.members) {
      await User.findByIdAndUpdate(member.user, {
        $pull: { groups: group._id },
      });
    }

    await Group.findByIdAndDelete(req.params.id);
    res.json({ msg: "Group removed" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

exports.joinGroup = async (req, res) => {
  try {
    console.log(
      `User ${req.user.id} attempting to join group ${req.params.id}`
    );

    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ msg: "Group not found" });
    }

    const isMember = group.members.some(
      (member) => member.user.toString() === req.user.id
    );

    if (isMember) {
      return res.status(400).json({ msg: "Already a member" });
    }

    const hasPendingRequest = group.pendingRequests.some(
      (request) => request.user.toString() === req.user.id
    );

    if (hasPendingRequest) {
      return res.status(400).json({ msg: "Request already pending" });
    }

    const hadInvitation =
      group.invitations &&
      group.invitations.some((inv) => inv.user.toString() === req.user.id);

    if (hadInvitation) {
      group.invitations = group.invitations.filter(
        (inv) => inv.user.toString() !== req.user.id
      );
      console.log(
        `User ${req.user.id} sent join request - removed pending invitation`
      );
    }

    console.log(
      `Adding user ${req.user.id} to pending requests for group ${req.params.id}`
    );

    group.pendingRequests.push({
      user: req.user.id,
      requestedAt: new Date(),
    });

    console.log(`Group pending requests after push:`, group.pendingRequests);

    await group.save();
    console.log(`Group saved with new pending request`);

    const message = hadInvitation
      ? "Join request sent to group admin. Your pending invitation was automatically cancelled."
      : "Join request sent to group admin";

    res.json({ msg: message });
  } catch (err) {
    console.error("Error in joinGroup:", err);
    res.status(500).send("Server error");
  }
};

exports.inviteToGroup = async (req, res) => {
  try {
    console.log(
      `User ${req.user.id} is trying to invite user ${req.params.userId} to group ${req.params.id}`
    );

    const group = await Group.findById(req.params.id);
    const userId = req.params.userId;

    if (!group) {
      console.log(`Group ${req.params.id} not found`);
      return res.status(404).json({ msg: "Group not found" });
    }

    const isAdmin = group.admin.toString() === req.user.id;
    const isMember = group.members.some(
      (member) => member.user.toString() === req.user.id
    );

    if (!isAdmin && !isMember) {
      console.log(`User ${req.user.id} is not authorized to invite others`);
      return res
        .status(401)
        .json({ msg: "Only members can invite others to join" });
    }

    const invitedUser = await User.findById(userId);
    if (!invitedUser) {
      console.log(`User to invite (${userId}) not found`);
      return res.status(404).json({ msg: "User not found" });
    }

    const isAlreadyMember = group.members.some(
      (member) => member.user.toString() === userId
    );

    if (isAlreadyMember) {
      console.log(`User ${userId} is already a member of the group`);
      return res.status(400).json({ msg: "User is already a member" });
    }

    const hasInvitation =
      group.invitations &&
      group.invitations.some(
        (invitation) => invitation.user.toString() === userId
      );

    if (hasInvitation) {
      console.log(`User ${userId} already has an invitation`);
      return res.status(400).json({ msg: "User has already been invited" });
    }

    const hadJoinRequest = group.pendingRequests.some(
      (request) => request.user.toString() === userId
    );

    if (hadJoinRequest) {
      group.pendingRequests = group.pendingRequests.filter(
        (request) => request.user.toString() !== userId
      );
      console.log(`User ${userId} was invited - removed pending join request`);
    }

    if (!group.invitations) {
      group.invitations = [];
    }

    console.log(
      `Adding user ${userId} to invitations, invited by ${req.user.id}`
    );
    group.invitations.push({
      user: userId,
      invitedBy: req.user.id,
      invitedAt: new Date(),
    });

    console.log(`Saving group with new invitation`);
    await group.save();

    console.log(`Invitation saved successfully`);
    const message = hadJoinRequest
      ? "Invitation sent successfully. The user's pending join request was automatically cancelled."
      : "Invitation sent successfully";

    res.json({ msg: message });
  } catch (err) {
    console.error("Error in inviteToGroup:", err);
    res.status(500).send("Server error");
  }
};

exports.respondToInvitation = async (req, res) => {
  try {
    const { accept } = req.body;
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ msg: "Group not found" });
    }

    const invitationIndex = group.invitations.findIndex(
      (invitation) => invitation.user.toString() === req.user.id
    );

    if (invitationIndex === -1) {
      return res.status(404).json({ msg: "Invitation not found" });
    }

    let hadJoinRequest = false;

    if (accept) {
      group.members.push({ user: req.user.id });

      hadJoinRequest = group.pendingRequests.some(
        (request) => request.user.toString() === req.user.id
      );

      if (hadJoinRequest) {
        group.pendingRequests = group.pendingRequests.filter(
          (request) => request.user.toString() !== req.user.id
        );
        console.log(
          `User ${req.user.id} accepted invitation - removed any pending join requests`
        );
      }

      await User.findByIdAndUpdate(req.user.id, {
        $push: { groups: group._id },
      });
    }

    group.invitations.splice(invitationIndex, 1);

    await group.save();

    res.json({
      msg: accept ? "Invitation accepted" : "Invitation declined",
      removedJoinRequest: accept && hadJoinRequest,
    });
  } catch (err) {
    console.error("Error in respondToInvitation:", err);
    res.status(500).send("Server error");
  }
};

exports.getUserInvitations = async (req, res) => {
  try {
    const groups = await Group.find({
      "invitations.user": req.user.id,
    })
      .populate("admin", ["username", "profilePicture"])
      .populate("invitations.invitedBy", ["username", "profilePicture"]);

    const invitations = groups.map((group) => {
      const invitation = group.invitations.find(
        (inv) => inv.user.toString() === req.user.id
      );
      return {
        group: {
          _id: group._id,
          name: group.name,
          description: group.description,
          isPrivate: group.isPrivate,
          admin: group.admin,
        },
        invitation: {
          invitedAt: invitation.invitedAt,
          invitedBy: invitation.invitedBy,
        },
      };
    });

    res.json(invitations);
  } catch (err) {
    console.error("Error in getUserInvitations:", err);
    res.status(500).send("Server error");
  }
};

exports.approveJoinRequest = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ msg: "Group not found" });
    }

    if (group.admin.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    const requestIndex = group.pendingRequests.findIndex(
      (request) => request.user.toString() === req.params.userId
    );

    if (requestIndex === -1) {
      return res.status(404).json({ msg: "Request not found" });
    }

    group.members.push({ user: req.params.userId });
    group.pendingRequests.splice(requestIndex, 1);

    await group.save();

    await User.findByIdAndUpdate(req.params.userId, {
      $push: { groups: group._id },
    });

    res.json({ msg: "User approved" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

exports.rejectJoinRequest = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ msg: "Group not found" });
    }

    if (group.admin.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    const requestIndex = group.pendingRequests.findIndex(
      (request) => request.user.toString() === req.params.userId
    );

    if (requestIndex === -1) {
      return res.status(404).json({ msg: "Request not found" });
    }

    group.pendingRequests.splice(requestIndex, 1);

    await group.save();

    res.json({ msg: "Request rejected" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

exports.searchGroups = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({ msg: "Search term required" });
    }

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

exports.removeMember = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ msg: "Group not found" });
    }

    if (group.admin.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    const memberIndex = group.members.findIndex(
      (member) => member.user.toString() === req.params.userId
    );

    if (memberIndex === -1) {
      return res.status(404).json({ msg: "Member not found" });
    }

    if (req.params.userId === group.admin.toString()) {
      return res.status(400).json({ msg: "Cannot remove group admin" });
    }

    group.members.splice(memberIndex, 1);
    await group.save();

    await User.findByIdAndUpdate(req.params.userId, {
      $pull: { groups: group._id },
    });

    res.json({ msg: "Member removed from group" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

exports.leaveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ msg: "Group not found" });
    }

    const memberIndex = group.members.findIndex(
      (member) => member.user.toString() === req.user.id
    );

    if (memberIndex === -1) {
      return res.status(400).json({ msg: "Not a member of this group" });
    }

    if (group.admin.toString() === req.user.id) {
      return res.status(400).json({
        msg: "Admin cannot leave the group. Transfer ownership first or delete the group.",
      });
    }

    group.members.splice(memberIndex, 1);

    await group.save();
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { groups: group._id },
    });

    res.json({ msg: "Successfully left the group" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};
