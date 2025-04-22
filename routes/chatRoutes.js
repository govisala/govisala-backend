import { Router } from "express";
import db from "../db/dbConn.js";

const router = Router();

//

// routes/chatRoutes.js - Additional endpoints

// Mark a message as seen
router.put("/messages/:messageId/seen", async (req, res) => {
  try {
    const messageId = req.params.messageId;

    await db.execute("UPDATE messages SET seen = 1 WHERE id = ?", [messageId]);

    res.status(200).json({ message: "Message marked as seen" });
  } catch (error) {
    console.error("Error marking message as seen:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Mark all messages in a chat as seen for a specific user
router.put("/:chatId/mark-seen", async (req, res) => {
  try {
    const chatId = req.params.chatId;
    const { userId } = req.body;

    await db.execute(
      "UPDATE messages SET seen = 1 WHERE chat_id = ? AND recipient_id = ?",
      [chatId, userId]
    );

    res.status(200).json({ message: "All messages marked as seen" });
  } catch (error) {
    console.error("Error marking messages as seen:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Send a message
router.post("/:chatId/messages", async (req, res) => {
  try {
    const chatId = req.params.chatId;
    const { senderId, recipientId, message } = req.body;

    // Verify user has access to this chat
    const [chatRows] = await db.execute(
      "SELECT buyer_id, seller_id FROM chats WHERE id = ?",
      [chatId]
    );

    if (chatRows.length === 0) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const chat = chatRows[0];

    if (chat.buyer_id !== senderId && chat.seller_id !== senderId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Insert the message
    const [result] = await db.execute(
      "INSERT INTO messages (chat_id, sender_id, recipient_id, message, created_at, seen) VALUES (?, ?, ?, ?, NOW(), 0)",
      [chatId, senderId, recipientId, message]
    );

    // Get the inserted message with sender info
    const [messageRows] = await db.execute(
      `
      SELECT 
        m.id,
        m.chat_id as chatId,
        m.sender_id as senderId,
        m.recipient_id as recipientId,
        m.message,
        m.created_at as timestamp,
        m.seen,
        JSON_OBJECT(
          'id', u.user_id,
          'name', u.user_name
        ) as sender
      FROM messages m
      JOIN users u ON m.sender_id = u.user_id
      WHERE m.id = ?
      `,
      [result.insertId]
    );

    if (messageRows.length === 0) {
      return res.status(500).json({ message: "Error retrieving sent message" });
    }

    const newMessage = {
      ...messageRows[0],
      sender: JSON.parse(messageRows[0].sender),
    };

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
