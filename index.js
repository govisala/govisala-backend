import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { createServer } from "http";
import { join, dirname } from "path";

// import dotenv
import "dotenv/config";

// import routes
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import notificationTest from "./routes/notificationTest.js";
import test from "./routes/test.js";

// import db connection
import db from "./db/dbConn.js";

import handleReactNativeUploads from "./middleware/fileHandlingMiddleware.js";

const app = express();

const httpServer = createServer(app);

const io = new Server(httpServer);

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Add middleware to handle React Native uploads
app.use(handleReactNativeUploads);

// Serve uploaded files
app.use("/uploads", express.static(join(dirname("./"), "uploads")));

app.get("/", async (req, res) => {
  res.send("Hello World");
});

app.use("/admin", adminRoutes);
app.use("/auth", authRoutes);
app.use("/notifi-test", notificationTest);
app.use("/test", test);

// chat socket
io.on("connection", (socket) => {
  // console.log("User connected:", socket.id);

  socket.on("bid-chat", ({ bid_id }) => {
    const roomName = `bidNo_${bid_id}`;
    socket.join(roomName);
    console.log(`User joined room: ${roomName}`);
  });

  socket.on("send-bid-msg", (data) => {
    const { msg_id, bid_id, sender_id, msg_txt } = data;
    const roomName = `bidNo_${bid_id}`;
    // Save message to the database
    db.query(
      "INSERT INTO messages (msg_id, bid_id, sender_id, msg_txt) VALUES (?, ?, ?, ?)",
      [msg_id, bid_id, sender_id, msg_txt]
    );

    // Emit the message to the room
    io.to(roomName).emit("receiveMessage", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

httpServer.listen(process.env.PORT, () => {
  console.log("Server is running on port http://localhost:" + process.env.PORT);
});
