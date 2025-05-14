// server/controllers/postController.js
const Post = require("../models/Post");
const Group = require("../models/Group");
const User = require("../models/User");
const { validationResult } = require("express-validator");

// @route   POST api/posts
// @desc    Create a post
// @access  Private
exports.createPost = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { text, group, mediaType, mediaUrl } = req.body;

    let finalMediaUrl = mediaUrl;
    let finalMediaType = mediaType;

    if (mediaType === "youtube" && mediaUrl) {
      // Extract YouTube video ID
      let videoId = "";

      // Handle various YouTube URL formats
      if (mediaUrl.includes("youtube.com/watch?v=")) {
        const urlObj = new URL(mediaUrl);
        videoId = urlObj.searchParams.get("v");
      } else if (mediaUrl.includes("youtu.be/")) {
        videoId = mediaUrl.split("youtu.be/")[1].split("?")[0];
      } else if (mediaUrl.includes("youtube.com/embed/")) {
        videoId = mediaUrl.split("youtube.com/embed/")[1].split("?")[0];
      }

      if (videoId) {
        // Set the embed URL
        finalMediaUrl = `https://www.youtube.com/embed/${videoId}`;
        finalMediaType = "youtube";
      } else {
        // Invalid YouTube URL
        return res.status(400).json({ msg: "Invalid YouTube URL" });
      }
    }

    // If posting to a group, check if user is a member
    if (group) {
      const groupDoc = await Group.findById(group);

      if (!groupDoc) {
        return res.status(404).json({ msg: "Group not found" });
      }

      const isMember = groupDoc.members.some(
        (member) => member.user.toString() === req.user.id
      );

      if (!isMember) {
        return res.status(403).json({ msg: "You must be a member to post" });
      }
    }

    // Create new post
    const newPost = new Post({
      text,
      user: req.user.id,
      group,
      mediaType: finalMediaType || "none",
      mediaUrl: finalMediaUrl || "",
    });

    const post = await newPost.save();

    // Populate user info
    await post.populate("user", ["username", "profilePicture"]);

    res.json(post);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// @route   GET api/posts
// @desc    Get all posts (feed)
// @access  Private
exports.getFeed = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // Get user's friends
    const friends = user.friends;

    // Get user's groups
    const groups = user.groups;

    // Find posts from friends and groups
    const posts = await Post.find({
      $or: [
        { user: { $in: [...friends, req.user.id] } },
        { group: { $in: groups } },
      ],
    })
      .populate("user", ["username", "profilePicture"])
      .populate("group", ["name"])
      .populate("comments.user", ["username", "profilePicture"])
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// @route   GET api/posts/:id
// @desc    Get post by ID
// @access  Private
exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("user", ["username", "profilePicture"])
      .populate("group", ["name"])
      .populate("comments.user", ["username", "profilePicture"]);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // Check if post is in a private group
    if (post.group) {
      const group = await Group.findById(post.group);

      if (group && group.isPrivate) {
        const isMember = group.members.some(
          (member) => member.user.toString() === req.user.id
        );

        if (!isMember) {
          return res.status(403).json({ msg: "Access denied" });
        }
      }
    }

    res.json(post);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Post not found" });
    }
    res.status(500).send("Server error");
  }
};

// @route   PUT api/posts/:id
// @desc    Update a post
// @access  Private
exports.updatePost = async (req, res) => {
  try {
    const { text, mediaType, mediaUrl } = req.body;
    let post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // Check if user owns the post
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    // Update fields
    if (text) post.text = text;
    if (mediaType) post.mediaType = mediaType;
    if (mediaUrl) post.mediaUrl = mediaUrl;

    await post.save();
    res.json(post);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// @route   DELETE api/posts/:id
// @desc    Delete a post
// @access  Private
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // Check if user owns the post or is group admin
    if (post.user.toString() !== req.user.id) {
      // If post is in a group, check if user is the group admin
      if (post.group) {
        const group = await Group.findById(post.group);
        if (!group || group.admin.toString() !== req.user.id) {
          return res.status(401).json({ msg: "Not authorized" });
        }
      } else {
        return res.status(401).json({ msg: "Not authorized" });
      }
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json({ msg: "Post removed" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// @route   PUT api/posts/like/:id
// @desc    Like a post
// @access  Private
exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // Check if post is in a private group
    if (post.group) {
      const group = await Group.findById(post.group);

      if (group && group.isPrivate) {
        const isMember = group.members.some(
          (member) => member.user.toString() === req.user.id
        );

        if (!isMember) {
          return res.status(403).json({ msg: "Access denied" });
        }
      }
    }

    // Check if post has already been liked by user
    if (post.likes.some((like) => like.toString() === req.user.id)) {
      return res.status(400).json({ msg: "Post already liked" });
    }

    post.likes.unshift(req.user.id);
    await post.save();

    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// @route   PUT api/posts/unlike/:id
// @desc    Unlike a post
// @access  Private
exports.unlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // Check if post is in a private group
    if (post.group) {
      const group = await Group.findById(post.group);

      if (group && group.isPrivate) {
        const isMember = group.members.some(
          (member) => member.user.toString() === req.user.id
        );

        if (!isMember) {
          return res.status(403).json({ msg: "Access denied" });
        }
      }
    }

    // Check if post has been liked by user
    if (!post.likes.some((like) => like.toString() === req.user.id)) {
      return res.status(400).json({ msg: "Post has not yet been liked" });
    }

    // Remove like
    post.likes = post.likes.filter((like) => like.toString() !== req.user.id);
    await post.save();

    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// @route   POST api/posts/comment/:id
// @desc    Comment on a post
// @access  Private
exports.addComment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // Check if post is in a private group
    if (post.group) {
      const group = await Group.findById(post.group);

      if (group && group.isPrivate) {
        const isMember = group.members.some(
          (member) => member.user.toString() === req.user.id
        );

        if (!isMember) {
          return res.status(403).json({ msg: "Access denied" });
        }
      }
    }

    const newComment = {
      text: req.body.text,
      user: req.user.id,
    };

    post.comments.unshift(newComment);
    await post.save();

    // Populate user info in the comments
    await post.populate("comments.user", ["username", "profilePicture"]);

    res.json(post.comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// @route   DELETE api/posts/comment/:id/:comment_id
// @desc    Delete comment
// @access  Private
exports.deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // Find comment
    const comment = post.comments.find(
      (comment) => comment._id.toString() === req.params.comment_id
    );

    if (!comment) {
      return res.status(404).json({ msg: "Comment not found" });
    }

    // Check if user owns the comment or post
    if (
      comment.user.toString() !== req.user.id &&
      post.user.toString() !== req.user.id
    ) {
      // If post is in a group, check if user is the group admin
      if (post.group) {
        const group = await Group.findById(post.group);
        if (!group || group.admin.toString() !== req.user.id) {
          return res.status(401).json({ msg: "Not authorized" });
        }
      } else {
        return res.status(401).json({ msg: "Not authorized" });
      }
    }

    // Remove comment
    post.comments = post.comments.filter(
      (comment) => comment._id.toString() !== req.params.comment_id
    );

    await post.save();
    res.json(post.comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// @route   GET api/posts/user/:userId
// @desc    Get all posts by user
// @access  Private
exports.getUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({ user: req.params.userId })
      .populate("user", ["username", "profilePicture"])
      .populate("group", ["name"])
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// @route   GET api/posts/group/:groupId
// @desc    Get all posts in a group
// @access  Private
exports.getGroupPosts = async (req, res) => {
  try {
    // Check if user has access to the group
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ msg: "Group not found" });
    }

    if (group.isPrivate) {
      const isMember = group.members.some(
        (member) => member.user.toString() === req.user.id
      );

      if (!isMember) {
        return res.status(403).json({ msg: "Access denied" });
      }
    }

    const posts = await Post.find({ group: req.params.groupId })
      .populate("user", ["username", "profilePicture"])
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// @route   GET api/posts/search
// @desc    Search posts by criteria
// @access  Private
exports.searchPosts = async (req, res) => {
  try {
    const { text } = req.query;

    if (!text) {
      return res.status(400).json({ msg: "Search term required" });
    }

    // First, get all groups the user is a member of
    const user = await User.findById(req.user.id);

    // Search for posts containing the text (case-insensitive)
    // Only return posts from public content or content user has access to
    const posts = await Post.find({
      text: { $regex: text, $options: "i" },
      $or: [
        { user: req.user.id }, // User's own posts
        { group: null }, // Public posts (not in any group)
        { group: { $in: user.groups } }, // Posts in groups user is a member of
      ],
    })
      .populate("user", "username profilePicture")
      .populate("group", "name")
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(posts);
  } catch (err) {
    console.error("Post search error:", err.message);
    res.status(500).send("Server error");
  }
};

exports.uploadPostMedia = async (req, res) => {
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({ msg: "No file uploaded" });
    }

    // Create the file URL
    const fileUrl = `/uploads/posts/${req.file.filename}`;

    // Determine media type from mimetype
    const mediaType = req.file.mimetype.startsWith("image/")
      ? "image"
      : "video";

    res.json({
      success: true,
      mediaUrl: fileUrl,
      mediaType: mediaType,
    });
  } catch (err) {
    console.error("Error uploading post media:", err);
    res.status(500).send("Server error");
  }
};
