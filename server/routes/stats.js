// server/routes/stats.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const statsController = require("../controllers/statsController");

// @route   GET api/stats/posts/monthly
// @desc    Get post count per month
// @access  Private
router.get("/posts/monthly", auth, statsController.getPostsPerMonth);

// @route   GET api/stats/groups/members
// @desc    Get top groups by member count
// @access  Private
router.get("/groups/members", auth, statsController.getGroupsByMembers);

// @route   GET api/stats/users/active
// @desc    Get most active users by post count
// @access  Private
router.get("/users/active", auth, statsController.getMostActiveUsers);

// @route   GET api/stats/posts/engagement
// @desc    Get posts with most engagement (comments + likes)
// @access  Private
router.get("/posts/engagement", auth, statsController.getPostEngagement);

module.exports = router;
