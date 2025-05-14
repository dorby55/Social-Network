// server/routes/posts.js
const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const auth = require("../middleware/auth");
const postController = require("../controllers/postController");
const { postMediaUpload } = require("../middleware/upload");

router.post(
  "/media-upload",
  auth,
  postMediaUpload.single("media"),
  postController.uploadPostMedia
);

// @route   POST api/posts
// @desc    Create a post
// @access  Private
router.post(
  "/",
  [auth, [check("text", "Text is required").not().isEmpty()]],
  postController.createPost
);

// @route   GET api/posts/search
// @desc    Search posts by criteria
// @access  Private
router.get("/search", auth, postController.searchPosts);

// @route   GET api/posts
// @desc    Get all posts (feed)
// @access  Private
router.get("/", auth, postController.getFeed);

// @route   GET api/posts/:id
// @desc    Get post by ID
// @access  Private
router.get("/:id", auth, postController.getPostById);

// @route   PUT api/posts/:id
// @desc    Update a post
// @access  Private
router.put("/:id", auth, postController.updatePost);

// @route   DELETE api/posts/:id
// @desc    Delete a post
// @access  Private
router.delete("/:id", auth, postController.deletePost);

// @route   PUT api/posts/like/:id
// @desc    Like a post
// @access  Private
router.put("/like/:id", auth, postController.likePost);

// @route   PUT api/posts/unlike/:id
// @desc    Unlike a post
// @access  Private
router.put("/unlike/:id", auth, postController.unlikePost);

// @route   POST api/posts/comment/:id
// @desc    Comment on a post
// @access  Private
router.post(
  "/comment/:id",
  [auth, [check("text", "Text is required").not().isEmpty()]],
  postController.addComment
);

// @route   DELETE api/posts/comment/:id/:comment_id
// @desc    Delete comment
// @access  Private
router.delete("/comment/:id/:comment_id", auth, postController.deleteComment);

// @route   GET api/posts/user/:userId
// @desc    Get all posts by user
// @access  Private
router.get("/user/:userId", auth, postController.getUserPosts);

// @route   GET api/posts/group/:groupId
// @desc    Get all posts in a group
// @access  Private
router.get("/group/:groupId", auth, postController.getGroupPosts);

module.exports = router;
