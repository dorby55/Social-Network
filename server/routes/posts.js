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

router.post(
  "/",
  [auth, [check("text", "Text is required").not().isEmpty()]],
  postController.createPost
);

router.get("/search", auth, postController.searchPosts);

router.get("/", auth, postController.getFeed);

router.get("/:id", auth, postController.getPostById);

router.put("/:id", auth, postController.updatePost);

router.delete("/:id", auth, postController.deletePost);

router.put("/like/:id", auth, postController.likePost);

router.put("/unlike/:id", auth, postController.unlikePost);

router.post(
  "/comment/:id",
  [auth, [check("text", "Text is required").not().isEmpty()]],
  postController.addComment
);

router.put(
  "/comment/:id/:comment_id",
  [auth, [check("text", "Text is required").not().isEmpty()]],
  postController.updateComment
);

router.delete("/comment/:id/:comment_id", auth, postController.deleteComment);

router.get("/user/:userId", auth, postController.getUserPosts);

router.get("/group/:groupId", auth, postController.getGroupPosts);

module.exports = router;
