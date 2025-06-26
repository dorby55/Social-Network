const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "client", "public")));
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });
app.get("/", (req, res) => {
  res.send("API Running");
});

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("join_room", (data) => {
    socket.join(data.room);
    console.log(`User ${socket.id} joined room: ${data.room}`);
  });

  socket.on("send_message", (data) => {
    console.log("Message received:", data);
    io.to(data.room).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

app.use("/api/users", require("./routes/users"));
app.use("/api/groups", require("./routes/groups"));
app.use("/api/posts", require("./routes/posts"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/stats", require("./routes/stats"));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Server Error");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
