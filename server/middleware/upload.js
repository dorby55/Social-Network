// server/middleware/upload.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create uploads directory if it doesn't exist
// Path to the client's public folder
const uploadsDir = path.join(
  __dirname,
  "..",
  "..",
  "client",
  "public",
  "uploads"
);
console.log(`Using uploads directory: ${uploadsDir}`);

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
  console.log(`Creating uploads directory: ${uploadsDir}`);
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "profile-" + uniqueSuffix + ext);
  },
});

// File filter to only accept images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Not an image! Please upload only images."), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5, // 5MB limit
  },
  fileFilter: fileFilter,
});

const postMediaStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const mediaDir = path.join(
      __dirname,
      "..",
      "..",
      "client",
      "public",
      "uploads",
      "posts"
    );
    if (!fs.existsSync(mediaDir)) {
      fs.mkdirSync(mediaDir, { recursive: true });
    }
    cb(null, mediaDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "post-" + uniqueSuffix + ext);
  },
});

// Create post media upload middleware
const postMediaUpload = multer({
  storage: postMediaStorage,
  limits: {
    fileSize: 1024 * 1024 * 10, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/")
    ) {
      cb(null, true);
    } else {
      cb(
        new Error("Unsupported file type. Only images and videos are allowed."),
        false
      );
    }
  },
});

module.exports = {
  profileUpload: upload, // Rename your existing upload for clarity
  postMediaUpload,
};
