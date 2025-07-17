const Post = require("../models/Post");
const Group = require("../models/Group");
const User = require("../models/User");
const { validationResult } = require("express-validator");

exports.createPost = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { text, group, mediaType, mediaUrl } = req.body;

    if (!text || text.trim().length === 0) {
      if (!mediaType || mediaType === "none" || !mediaUrl) {
        return res
          .status(400)
          .json({ msg: "Post must contain either text or media" });
      }
    }

    const validMediaTypes = ["none", "image", "video"];
    const finalMediaType =
      mediaType && validMediaTypes.includes(mediaType) ? mediaType : "none";
    const finalMediaUrl = finalMediaType !== "none" ? mediaUrl || "" : "";

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

    const newPost = new Post({
      text: text.trim() || "",
      user: req.user.id,
      group: group || null,
      mediaType: finalMediaType,
      mediaUrl: finalMediaUrl,
    });

    const post = await newPost.save();

    await post.populate("user", ["username", "profilePicture"]);

    res.json(post);
  } catch (err) {
    console.error("Error creating post:", err.message);
    console.error("Full error:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.getFeed = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const friends = user.friends;
    const userGroups = user.groups;

    const publicGroups = await Group.find({ isPrivate: false }).select("_id");
    const publicGroupIds = publicGroups.map((group) => group._id);

    const allowedGroupIds = [...userGroups, ...publicGroupIds];

    const posts = await Post.find({
      $or: [
        {
          user: { $in: [...friends, req.user.id] },
          group: { $exists: false },
        },
        {
          user: { $in: [...friends, req.user.id] },
          group: null,
        },
        {
          group: { $in: allowedGroupIds },
        },
      ],
    })
      .populate("user", ["username", "profilePicture"])
      .populate("group", ["name", "isPrivate"])
      .populate("comments.user", ["username", "profilePicture"])
      .sort({ createdAt: -1 });

    const filteredPosts = posts.filter((post) => {
      if (!post.group) {
        return true;
      }

      if (!post.group.isPrivate) {
        return true;
      }

      const isMember = userGroups.some(
        (groupId) => groupId.toString() === post.group._id.toString()
      );
      return isMember;
    });

    res.json(filteredPosts);
  } catch (err) {
    console.error("Error in getFeed:", err.message);
    res.status(500).send("Server error");
  }
};

exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("user", ["username", "profilePicture"])
      .populate("group", ["name"])
      .populate("comments.user", ["username", "profilePicture"]);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

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

exports.updatePost = async (req, res) => {
  try {
    const { text, mediaType, mediaUrl, content } = req.body;
    let post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    if (text) post.text = text;
    if (content) post.text = content;
    if (mediaType) post.mediaType = mediaType;
    if (mediaUrl) post.mediaUrl = mediaUrl;

    post.editedAt = new Date();

    await post.save();
    await post.populate("user", ["username", "profilePicture"]);

    res.json(post);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Post not found" });
    }
    res.status(500).send("Server error");
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    if (post.user.toString() !== req.user.id) {
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

exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

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

exports.unlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

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

    if (!post.likes.some((like) => like.toString() === req.user.id)) {
      return res.status(400).json({ msg: "Post has not yet been liked" });
    }

    post.likes = post.likes.filter((like) => like.toString() !== req.user.id);
    await post.save();

    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

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
    await post.populate("comments.user", ["username", "profilePicture"]);
    res.json(post.comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

exports.updateComment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    const comment = post.comments.find(
      (comment) => comment._id.toString() === req.params.comment_id
    );

    if (!comment) {
      return res.status(404).json({ msg: "Comment not found" });
    }

    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    comment.text = req.body.text;
    comment.editedAt = new Date();

    await post.save();
    await post.populate("comments.user", ["username", "profilePicture"]);
    res.json(post.comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    const comment = post.comments.find(
      (comment) => comment._id.toString() === req.params.comment_id
    );

    if (!comment) {
      return res.status(404).json({ msg: "Comment not found" });
    }

    if (
      comment.user.toString() !== req.user.id &&
      post.user.toString() !== req.user.id
    ) {
      if (post.group) {
        const group = await Group.findById(post.group);
        if (!group || group.admin.toString() !== req.user.id) {
          return res.status(401).json({ msg: "Not authorized" });
        }
      } else {
        return res.status(401).json({ msg: "Not authorized" });
      }
    }

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

exports.getGroupPosts = async (req, res) => {
  try {
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
      .populate("group", ["name"])
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

exports.searchPosts = async (req, res) => {
  try {
    const { text } = req.query;

    if (!text) {
      return res.status(400).json({ msg: "Search term required" });
    }

    const user = await User.findById(req.user.id);
    const posts = await Post.find({
      text: { $regex: text, $options: "i" },
      $or: [
        { user: req.user.id },
        { group: null },
        { group: { $in: user.groups } },
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
    if (!req.file) {
      return res.status(400).json({ msg: "No file uploaded" });
    }

    const fileUrl = `/uploads/posts/${req.file.filename}`;
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
