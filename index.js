import express from "express";
import cors from "cors";
import { createServer } from "http";
import { join, dirname } from "path";
import { Server } from "socket.io";

// import dotenv
import "dotenv/config";

// import routes
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import notificationTest from "./routes/notificationTest.js";
import buyerRoutes from "./routes/buyerRouters.js";
import sellerRoutes from "./routes/sellerRouters.js";
import chatRoutes from "./routes/chatRoutes.js";
import test from "./routes/test.js";

// import db connection
import db from "./db/dbConn.js";

import handleReactNativeUploads from "./middleware/fileHandlingMiddleware.js";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
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
app.use("/buyer", buyerRoutes);
app.use("/seller", sellerRoutes);
app.use("/chat", chatRoutes);

// chat socket
// Socket middleware for authentication
io.use((socket, next) => {
  const token = socket.handshake.query.token;
  const userId = socket.handshake.query.userId;

  if (!token || !userId) {
    return next(new Error("Authentication error"));
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err || decoded.id !== parseInt(userId)) {
      return next(new Error("Authentication error"));
    }

    socket.userId = userId;
    next();
  });
});

// Socket connection handling
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.userId}`);

  // Join user to a room based on their ID
  socket.join(`user_${socket.userId}`);

  // Handle sending messages
  socket.on("send_message", async (messageData) => {
    try {
      const { chatId, senderId, recipientId, message, listingId, timestamp } =
        messageData;

      // Save message to database
      const [result] = await db.execute(
        "INSERT INTO messages (chat_id, sender_id, recipient_id, message, created_at) VALUES (?, ?, ?, ?, ?)",
        [chatId, senderId, recipientId, message, timestamp]
      );

      const messageId = result.insertId;

      // Get sender details
      const [senderRows] = await db.execute(
        "SELECT name FROM users WHERE id = ?",
        [senderId]
      );

      if (senderRows.length === 0) {
        throw new Error("Sender not found");
      }

      const completeMessage = {
        id: messageId,
        chatId,
        senderId: parseInt(senderId),
        recipientId: parseInt(recipientId),
        message,
        timestamp,
        seen: false,
        sender: {
          id: parseInt(senderId),
          name: senderRows[0].name,
        },
      };

      // Send message to recipient
      io.to(`user_${recipientId}`).emit("receive_message", completeMessage);

      // Also send back to sender for confirmation
      socket.emit("receive_message", completeMessage);

      // Check for unread messages count
      const [unreadCount] = await db.execute(
        "SELECT COUNT(*) as count FROM messages WHERE chat_id = ? AND recipient_id = ? AND seen = 0",
        [chatId, recipientId]
      );

      // If unread count >= 5, send email notification
      if (unreadCount[0].count >= 5) {
        await sendEmailNotification(recipientId, listingId, chatId);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // Mark message as seen
  socket.on("mark_seen", async (data) => {
    try {
      const { messageId, userId, chatId } = data;

      await db.execute(
        "UPDATE messages SET seen = 1 WHERE id = ? AND recipient_id = ?",
        [messageId, userId]
      );

      // Notify the sender that the message has been seen
      const [messageData] = await db.execute(
        "SELECT sender_id FROM messages WHERE id = ?",
        [messageId]
      );

      if (messageData.length > 0) {
        io.to(`user_${messageData[0].sender_id}`).emit("message_seen", {
          messageId,
          chatId,
        });
      }
    } catch (error) {
      console.error("Error marking message as seen:", error);
    }
  });

  // Mark all messages in a chat as seen
  socket.on("mark_all_seen", async (data) => {
    try {
      const { chatId, userId } = data;

      await db.execute(
        "UPDATE messages SET seen = 1 WHERE chat_id = ? AND recipient_id = ? AND seen = 0",
        [chatId, userId]
      );

      // Notify others in the chat that messages have been seen
      socket.to(`chat_${chatId}`).emit("all_messages_seen", {
        chatId,
        userId,
      });
    } catch (error) {
      console.error("Error marking all messages as seen:", error);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.userId}`);
  });
});

// Send email notification for unread messages
async function sendEmailNotification(userId, listingId, chatId) {
  try {
    // Get user email
    const [userRows] = await db.execute(
      "SELECT email, name FROM users WHERE id = ?",
      [userId]
    );

    if (userRows.length === 0) {
      throw new Error("User not found");
    }

    const userEmail = userRows[0].email;
    const userName = userRows[0].name;

    // Get listing details
    const [listingRows] = await db.execute(
      "SELECT title, type FROM listings WHERE id = ?",
      [listingId]
    );

    if (listingRows.length === 0) {
      throw new Error("Listing not found");
    }

    const listingTitle = listingRows[0].title;
    const listingType = listingRows[0].type;

    // Send email
    await transporter.sendMail({
      from: `"Marketplace Chat" <${process.env.EMAIL_FROM}>`,
      to: userEmail,
      subject: `You have unread messages about ${
        listingType === "buyer" ? "your buying request" : "a selling listing"
      }`,
      html: `
        <h1>Hello ${userName},</h1>
        <p>You have 5 or more unread messages in a chat regarding:</p>
        <p><strong>${listingTitle}</strong> (${
        listingType === "buyer" ? "Buyer Listing" : "Seller Listing"
      })</p>
        <p>Please log in to your account to respond.</p>
        <a href="${
          process.env.APP_URL
        }/chats/${chatId}" style="padding: 10px 15px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
          View Messages
        </a>
        <p>Thanks,<br>The Marketplace Team</p>
      `,
    });

    console.log(`Email notification sent to ${userEmail}`);
  } catch (error) {
    console.error("Error sending email notification:", error);
  }
}
server.listen(process.env.PORT, () => {
  console.log("Server is running on port http://localhost:" + process.env.PORT);
});
