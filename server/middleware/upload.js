const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadsDir = path.join(
  __dirname,
  "..",
  "..",
  "client",
  "public",
  "uploads"
);

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

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
    fileSize: 1024 * 1024 * 5,
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

const postMediaUpload = multer({
  storage: postMediaStorage,
  limits: {
    fileSize: 1024 * 1024 * 10,
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
  profileUpload: upload,
  postMediaUpload,
};
