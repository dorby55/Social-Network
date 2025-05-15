// server/routes/groups.js
const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const auth = require("../middleware/auth");
const groupController = require("../controllers/groupController");

// @route   POST api/groups
// @desc    Create a new group
// @access  Private
router.post(
  "/",
  [
    auth,
    [
      check("name", "Name is required").not().isEmpty(),
      check("description", "Description is required").not().isEmpty(),
    ],
  ],
  groupController.createGroup
);

// @route   GET api/groups
// @desc    Get all public groups
// @access  Private
router.get("/", auth, groupController.getAllGroups);

// @route   GET api/groups/my
// @desc    Get user's groups
// @access  Private
router.get("/my", auth, groupController.getUserGroups);

// @route   GET api/groups/search
// @desc    Search groups by criteria
// @access  Private
router.get("/search", auth, groupController.searchGroups);

router.get("/invitations", auth, groupController.getUserInvitations);

// @route   GET api/groups/:id
// @desc    Get group by ID
// @access  Private
router.get("/:id", auth, groupController.getGroupById);

// @route   PUT api/groups/:id
// @desc    Update a group
// @access  Private
router.put("/:id", auth, groupController.updateGroup);

// @route   DELETE api/groups/:id
// @desc    Delete a group
// @access  Private
router.delete("/:id", auth, groupController.deleteGroup);

router.post("/:id/invite/:userId", auth, groupController.inviteToGroup);
router.put("/:id/invitation", auth, groupController.respondToInvitation);

// @route   POST api/groups/:id/join
// @desc    Request to join a group
// @access  Private
router.post("/:id/join", auth, groupController.joinGroup);

// @route   POST api/groups/:id/approve/:userId
// @desc    Approve a join request
// @access  Private
router.post("/:id/approve/:userId", auth, groupController.approveJoinRequest);

// @route   POST api/groups/:id/reject/:userId
// @desc    Reject a join request
// @access  Private
router.post("/:id/reject/:userId", auth, groupController.rejectJoinRequest);

router.delete("/:id/members/:userId", auth, groupController.removeMember);

// @route   POST api/groups/:id/leave
// @desc    Leave a group
// @access  Private
router.delete("/:id/leave", auth, groupController.leaveGroup);

module.exports = router;
