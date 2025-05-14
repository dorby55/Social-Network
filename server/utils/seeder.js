// server/utils/seeder.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Group = require("../models/Group");
const Post = require("../models/Post");
const Message = require("../models/Message");
require("dotenv").config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected for seeding"))
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

// Clear database
const clearDB = async () => {
  try {
    await Message.deleteMany({});
    await Post.deleteMany({});
    await Group.deleteMany({});
    await User.deleteMany({});
    console.log("Database cleared");
  } catch (err) {
    console.error("Error clearing database:", err.message);
    process.exit(1);
  }
};

// Create seed data
const seedData = async () => {
  try {
    // Create users
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("password123", salt);

    const users = await User.insertMany([
      {
        username: "admin",
        email: "admin@example.com",
        password: hashedPassword,
        bio: "System administrator",
        isAdmin: true,
      },
      {
        username: "john",
        email: "john@example.com",
        password: hashedPassword,
        bio: "Software developer",
      },
      {
        username: "sarah",
        email: "sarah@example.com",
        password: hashedPassword,
        bio: "Graphic designer",
      },
      {
        username: "mike",
        email: "mike@example.com",
        password: hashedPassword,
        bio: "Marketing specialist",
      },
      {
        username: "emma",
        email: "emma@example.com",
        password: hashedPassword,
        bio: "HR manager",
      },
    ]);

    console.log(`${users.length} users created`);

    // Add friends
    const john = users.find((user) => user.username === "john");
    const sarah = users.find((user) => user.username === "sarah");
    const mike = users.find((user) => user.username === "mike");
    const emma = users.find((user) => user.username === "emma");

    john.friends.push(sarah._id, mike._id);
    sarah.friends.push(john._id, emma._id);
    mike.friends.push(john._id, emma._id);
    emma.friends.push(sarah._id, mike._id);

    await Promise.all([john.save(), sarah.save(), mike.save(), emma.save()]);
    console.log("Friendships created");

    // Create groups
    const groups = await Group.insertMany([
      {
        name: "Developers",
        description:
          "A group for software developers to share knowledge and resources",
        isPrivate: false,
        admin: john._id,
        members: [{ user: john._id }, { user: mike._id }, { user: sarah._id }],
      },
      {
        name: "Designers",
        description: "A place to share design inspiration and get feedback",
        isPrivate: false,
        admin: sarah._id,
        members: [{ user: sarah._id }, { user: emma._id }],
      },
      {
        name: "Marketing",
        description: "Discuss marketing strategies and trends",
        isPrivate: true,
        admin: mike._id,
        members: [{ user: mike._id }, { user: emma._id }],
      },
    ]);

    console.log(`${groups.length} groups created`);

    // Update users with group memberships
    john.groups.push(groups[0]._id);
    sarah.groups.push(groups[0]._id, groups[1]._id);
    mike.groups.push(groups[0]._id, groups[2]._id);
    emma.groups.push(groups[1]._id, groups[2]._id);

    await Promise.all([john.save(), sarah.save(), mike.save(), emma.save()]);

    // Create posts
    const developersGroup = groups.find((group) => group.name === "Developers");
    const designersGroup = groups.find((group) => group.name === "Designers");
    const marketingGroup = groups.find((group) => group.name === "Marketing");

    const posts = await Post.insertMany([
      {
        text: "Hello everyone! This is my first post in the Developers group.",
        user: john._id,
        group: developersGroup._id,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      },
      {
        text: "I just found this amazing JavaScript library. Check it out!",
        user: john._id,
        group: developersGroup._id,
        createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
      },
      {
        text: "What do you think about this color palette for our new project?",
        user: sarah._id,
        group: designersGroup._id,
        mediaType: "image",
        mediaUrl: "https://via.placeholder.com/800x600",
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
      },
      {
        text: "Our marketing campaign exceeded expectations! Here are the results.",
        user: mike._id,
        group: marketingGroup._id,
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      },
      {
        text: "Just wanted to share my thoughts on the new React update.",
        user: john._id,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      },
      {
        text: "Check out this beautiful UI design I just created!",
        user: sarah._id,
        mediaType: "image",
        mediaUrl: "https://via.placeholder.com/1200x800",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
      {
        text: "Happy to be part of this community!",
        user: emma._id,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
    ]);

    console.log(`${posts.length} posts created`);

    // Add comments to posts
    const firstPost = posts[0];
    firstPost.comments.push(
      {
        user: sarah._id,
        text: "Welcome to the group!",
        date: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
      },
      {
        user: mike._id,
        text: "Glad to have you here!",
        date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
      }
    );

    const secondPost = posts[1];
    secondPost.comments.push({
      user: mike._id,
      text: "This looks really useful! Thanks for sharing.",
      date: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000),
    });

    await Promise.all([firstPost.save(), secondPost.save()]);

    // Add likes to posts
    firstPost.likes.push(sarah._id, mike._id);
    secondPost.likes.push(sarah._id, mike._id, emma._id);
    posts[2].likes.push(emma._id);
    posts[3].likes.push(emma._id);
    posts[4].likes.push(sarah._id, emma._id);
    posts[5].likes.push(john._id, mike._id, emma._id);
    posts[6].likes.push(john._id, sarah._id, mike._id);

    await Promise.all(posts.map((post) => post.save()));

    // Create messages
    const johnSarahRoom = [john._id, sarah._id].sort().join("_");
    const johnMikeRoom = [john._id, mike._id].sort().join("_");
    const sarahEmmaRoom = [sarah._id, emma._id].sort().join("_");

    await Message.insertMany([
      {
        sender: john._id,
        receiver: sarah._id,
        content: "Hey Sarah, how are you?",
        room: johnSarahRoom,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        sender: sarah._id,
        receiver: john._id,
        content: "I'm good, thanks! How about you?",
        room: johnSarahRoom,
        createdAt: new Date(
          Date.now() - 5 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000
        ),
      },
      {
        sender: john._id,
        receiver: sarah._id,
        content: "Doing well! Working on a new project.",
        room: johnSarahRoom,
        createdAt: new Date(
          Date.now() - 5 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000
        ),
      },
      {
        sender: john._id,
        receiver: mike._id,
        content: "Mike, do you have time to discuss the marketing strategy?",
        room: johnMikeRoom,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        sender: mike._id,
        receiver: john._id,
        content: "Sure, I'm free tomorrow afternoon.",
        room: johnMikeRoom,
        createdAt: new Date(
          Date.now() - 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000
        ),
      },
      {
        sender: sarah._id,
        receiver: emma._id,
        content: "Emma, I need your feedback on my latest design.",
        room: sarahEmmaRoom,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        sender: emma._id,
        receiver: sarah._id,
        content: "I'll take a look at it today!",
        room: sarahEmmaRoom,
        createdAt: new Date(
          Date.now() - 1 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000
        ),
      },
    ]);

    console.log("Messages created");

    console.log("Database seeded successfully");
  } catch (err) {
    console.error("Error seeding database:", err.message);
  } finally {
    mongoose.disconnect();
  }
};

// Run the seeder
const runSeeder = async () => {
  await clearDB();
  await seedData();
};

runSeeder();
