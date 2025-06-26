const Post = require("../models/Post");
const Group = require("../models/Group");
const User = require("../models/User");

exports.getPostsPerMonth = async (req, res) => {
  try {
    const posts = await Post.find();

    const postsPerMonth = {};

    posts.forEach((post) => {
      const date = new Date(post.createdAt);
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;

      if (!postsPerMonth[monthYear]) {
        postsPerMonth[monthYear] = 0;
      }

      postsPerMonth[monthYear]++;
    });

    const result = Object.keys(postsPerMonth).map((monthYear) => ({
      month: monthYear,
      count: postsPerMonth[monthYear],
    }));

    result.sort((a, b) => {
      const [aMonth, aYear] = a.month.split("/");
      const [bMonth, bYear] = b.month.split("/");

      if (aYear !== bYear) {
        return aYear - bYear;
      }

      return aMonth - bMonth;
    });

    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

exports.getGroupsByMembers = async (req, res) => {
  try {
    const groups = await Group.find()
      .populate("admin", ["username"])
      .select("name members admin isPrivate");

    const sortedGroups = groups
      .map((group) => ({
        name: group.name,
        memberCount: group.members.length,
        admin: group.admin.username,
        isPrivate: group.isPrivate,
      }))
      .sort((a, b) => b.memberCount - a.memberCount);

    res.json(sortedGroups);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

exports.getMostActiveUsers = async (req, res) => {
  try {
    const postsPerUser = await Post.aggregate([
      {
        $group: {
          _id: "$user",
          postCount: { $sum: 1 },
        },
      },
      {
        $sort: { postCount: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    const userIds = postsPerUser.map((item) => item._id);
    const users = await User.find({ _id: { $in: userIds } }).select(
      "username profilePicture"
    );

    const result = postsPerUser.map((item) => {
      const user = users.find((u) => u._id.toString() === item._id.toString());
      return {
        user: {
          _id: user._id,
          username: user.username,
          profilePicture: user.profilePicture,
        },
        postCount: item.postCount,
      };
    });

    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

exports.getPostEngagement = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", ["username", "profilePicture"])
      .select("text likes comments createdAt");

    const postsWithEngagement = posts.map((post) => ({
      _id: post._id,
      text: post.text.substring(0, 50) + (post.text.length > 50 ? "..." : ""),
      user: post.user,
      likes: post.likes.length,
      comments: post.comments.length,
      totalEngagement: post.likes.length + post.comments.length,
      createdAt: post.createdAt,
    }));

    postsWithEngagement.sort((a, b) => b.totalEngagement - a.totalEngagement);

    res.json(postsWithEngagement.slice(0, 10));
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};
