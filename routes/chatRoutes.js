import { Router } from "express";
import db from "../db/dbConn.js";

const router = Router();

// Get all chats for a user
router.get("/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    // Verify the user ID matches the authenticated user
    if (req.user.id !== parseInt(userId)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const [rows] = await db.execute(
      `
      SELECT 
        c.id as chatId,
        c.listing_id as listingId,
        l.type as listingType,
        l.title as listingTitle,
        IF(c.buyer_id = ?, c.seller_id, c.buyer_id) as recipientId,
        u.name as recipientName,
        m.message as lastMessage,
        m.created_at as lastMessageTime,
        (SELECT COUNT(*) FROM messages 
         WHERE chat_id = c.id AND recipient_id = ? AND seen = 0) as unreadCount
      FROM chats c
      JOIN listings l ON c.listing_id = l.id
      JOIN users u ON (u.id = IF(c.buyer_id = ?, c.seller_id, c.buyer_id))
      LEFT JOIN (
        SELECT 
          chat_id,
          message,
          created_at,
          ROW_NUMBER() OVER (PARTITION BY chat_id ORDER BY created_at DESC) as rn
        FROM messages
      ) m ON m.chat_id = c.id AND m.rn = 1
      WHERE c.buyer_id = ? OR c.seller_id = ?
      ORDER BY m.created_at DESC
    `,
      [userId, userId, userId, userId, userId]
    );

    res.json(rows);
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get messages for a specific chat
router.get("/:chatId/messages", async (req, res) => {
  try {
    const chatId = req.params.chatId;
    const userId = req.user.id;

    // Verify user has access to this chat
    const [chatRows] = await db.execute(
      "SELECT buyer_id, seller_id FROM chats WHERE id = ?",
      [chatId]
    );

    if (chatRows.length === 0) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const chat = chatRows[0];

    if (chat.buyer_id !== userId && chat.seller_id !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Get messages
    const [rows] = await db.execute(
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
          'id', u.id,
          'name', u.name
        ) as sender
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.chat_id = ?
      ORDER BY m.created_at ASC
    `,
      [chatId]
    );

    // Parse the JSON string for sender
    const messages = rows.map((row) => ({
      ...row,
      sender: JSON.parse(row.sender),
    }));

    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create a new chat
router.post("", async (req, res) => {
  try {
    const { buyerId, sellerId, listingId } = req.body;

    // Verify either buyer or seller ID matches authenticated user
    if (req.user.id !== buyerId && req.user.id !== sellerId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check if chat already exists
    const [existingChats] = await db.execute(
      "SELECT id FROM chats WHERE buyer_id = ? AND seller_id = ? AND listing_id = ?",
      [buyerId, sellerId, listingId]
    );

    if (existingChats.length > 0) {
      return res.json({ chatId: existingChats[0].id });
    }

    // Create new chat
    const [result] = await db.execute(
      "INSERT INTO chats (buyer_id, seller_id, listing_id, created_at) VALUES (?, ?, ?, NOW())",
      [buyerId, sellerId, listingId]
    );

    res.status(201).json({ chatId: result.insertId });
  } catch (error) {
    console.error("Error creating chat:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
