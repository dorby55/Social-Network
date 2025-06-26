const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const statsController = require("../controllers/statsController");

router.get("/posts/monthly", auth, statsController.getPostsPerMonth);

router.get("/groups/members", auth, statsController.getGroupsByMembers);

router.get("/users/active", auth, statsController.getMostActiveUsers);

router.get("/posts/engagement", auth, statsController.getPostEngagement);

module.exports = router;
