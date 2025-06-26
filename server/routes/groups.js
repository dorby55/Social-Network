const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const auth = require("../middleware/auth");
const groupController = require("../controllers/groupController");

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

router.get("/", auth, groupController.getAllGroups);

router.get("/my", auth, groupController.getUserGroups);

router.get("/search", auth, groupController.searchGroups);

router.get("/invitations", auth, groupController.getUserInvitations);

router.get("/:id", auth, groupController.getGroupById);

router.put("/:id", auth, groupController.updateGroup);

router.delete("/:id", auth, groupController.deleteGroup);

router.post("/:id/invite/:userId", auth, groupController.inviteToGroup);

router.put("/:id/invitation", auth, groupController.respondToInvitation);

router.post("/:id/join", auth, groupController.joinGroup);

router.post("/:id/approve/:userId", auth, groupController.approveJoinRequest);

router.post("/:id/reject/:userId", auth, groupController.rejectJoinRequest);

router.delete("/:id/members/:userId", auth, groupController.removeMember);

router.delete("/:id/leave", auth, groupController.leaveGroup);

module.exports = router;
