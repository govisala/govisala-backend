import { Router } from "express";
import { nanoid } from "nanoid";
import db from "../db/dbConn.js";
import fs from "fs";
import upload from "../storage/storage.js";

const router = Router();

// Post buyer request
router.post(
  "/post-buyer-request",
  upload.fields([{ name: "buyerReqImages", maxCount: 5 }]),
  async (req, res) => {
    try {
      const {
        ItemName,
        Quantity,
        Quality,
        Location,
        Area,
        RequiredDate,
        BidFrom,
        BidTo,
        Addi,
        UserId,
        StkType,
      } = req.body;

      console.log(req.body.StkType);

      // Insert the main request data into the database
      const [result] = await db.execute(
        `INSERT INTO buyer_requests (item_name, quantity, stk_type, quality_grade, location, area, required_date, bid_from, bid_to, additional_notes, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          ItemName,
          Quantity,
          StkType,
          Quality,
          Location,
          Area,
          RequiredDate,
          BidFrom,
          BidTo,
          Addi,
          UserId,
        ]
      );

      // Process uploaded images if any - CORRECTED FIELD NAME HERE
      const uploadedImages = [];
      if (req.files && req.files.buyerReqImages) {
        // Changed from 'images' to 'buyerReqImages'
        for (const file of req.files.buyerReqImages) {
          // Changed from 'images' to 'buyerReqImages'
          const imagePath = file.path;

          // Insert image reference to database
          await db.execute(
            `INSERT INTO buyer_req_images (request_id, image_path, created_at)
            VALUES (?, ?, NOW())`,
            [result.insertId, imagePath]
          );

          uploadedImages.push({
            path: imagePath,
          });
        }
      }

      res.status(201).json({
        success: true,
        message: "Buyer request created successfully",
        data: {
          result: result.insertId,
          images: uploadedImages,
        },
      });
    } catch (error) {
      console.error("Error creating buyer request:", error);

      // If there was an error, clean up any uploaded files
      if (req.files && req.files.buyerReqImages) {
        // Changed from 'images' to 'buyerReqImages'
        req.files.buyerReqImages.forEach((file) => {
          // Changed from 'images' to 'buyerReqImages'
          fs.unlink(file.path, (err) => {
            if (err) console.error("Error deleting file:", err);
          });
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to create buyer request",
        error: error.message,
      });
    }
  }
);

// Get all buyer requests
router.get("/buyer-requests", async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT * FROM buyer_requests 
      ORDER BY created_at DESC
    `);

    // Fetch images for each request
    for (let request of rows) {
      const [images] = await db.execute(
        `
        SELECT id, image_path FROM buyer_req_images 
        WHERE request_id = ?
      `,
        [request.id]
      );

      request.images = images;
    }

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching buyer requests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch buyer requests",
      error: error.message,
    });
  }
});

// Get a single buyer request by ID
router.get("/buyer-request/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;

    const [rows] = await db.execute(
      `SELECT * FROM buyer_requests WHERE id = ?`,
      [requestId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Buyer request not found",
      });
    }

    // Fetch images for the request
    const [images] = await db.execute(
      `
      SELECT id, image_path FROM buyer_req_images 
      WHERE request_id = ?
    `,
      [requestId]
    );

    rows[0].images = images;

    res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("Error fetching buyer request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch buyer request",
      error: error.message,
    });
  }
});

// delete buyer request by ID
router.delete("/delete-req/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;

    // Delete images associated with the request
    const [images] = await db.execute(
      `
      SELECT image_path FROM buyer_req_images 
      WHERE request_id = ?
    `,
      [requestId]
    );

    for (const image of images) {
      fs.unlink(image.image_path, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
    }

    // Delete the request
    await db.execute(
      `
      DELETE FROM buyer_requests 
      WHERE id = ?
    `,
      [requestId]
    );

    res.json({
      success: true,
      message: "Buyer request deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting buyer request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete buyer request",
      error: error.message,
    });
  }
});

//update clicks count one by one
router.put("/update-clicks/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;

    // Update the clicks count
    await db.execute(
      `
      UPDATE buyer_requests 
      SET clicks = clicks + 1 
      WHERE id = ?
    `,
      [requestId]
    );

    res.json({
      success: true,
      message: "Clicks count updated successfully",
    });
  } catch (error) {
    console.error("Error updating clicks count:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update clicks count",
      error: error.message,
    });
  }
});

// fetch bids yousing buyer req id
router.get("/bids/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;

    // needs to join with user table to get the user name
    const [rows] = await db.execute(
      `SELECT b.*, u.user_name AS user_name FROM bids b JOIN users u ON b.seller_id = u.user_id WHERE b.req_id = ?`,
      [requestId]
    );
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No bids found for this request",
      });
    }

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching bids:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bids",
      error: error.message,
    });
  }
});

// create transaction end point
router.post("/create-transaction", async (req, res) => {
  try {
    const { senderId, recieverId, amount, fees } = req.body;

    // Input validation
    if (!senderId || !recieverId || !amount || fees === undefined) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: senderId, recieverId, amount, and fees are required",
      });
    }

    // Insert the transaction into the database
    const [result] = await db.execute(
      `INSERT INTO transactions (sender_id, reciever_id, amount, fees, created_at) VALUES (?, ?, ?, ?, NOW())`,
      [senderId, recieverId, amount, fees]
    );

    res.status(201).json({
      success: true,
      message: "Transaction created successfully",
      data: {
        transactionId: result.insertId,
      },
    });
  } catch (error) {
    console.error("Error creating transaction:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create transaction",
      error: error.message,
    });
  }
});

export default router;
