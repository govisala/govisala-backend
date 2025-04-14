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
    // log image files
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
      } = req.body;

      // Generate a unique ID for the request
      const requestId = nanoid(10);

      // Insert the main request data into the database
      const [result] = await db.execute(
        `INSERT INTO buyer_requests 
        (request_id, item_name, quantity, quality_grade, location, area, required_date, bid_from, bid_to, additional_notes, user_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          requestId,
          ItemName,
          Quantity,
          Quality,
          Location,
          Area,
          RequiredDate,
          BidFrom,
          BidTo,
          Addi,
          "1231asd",
        ]
      );

      // Process uploaded images if any
      const uploadedImages = [];
      if (req.files && req.files.images) {
        for (const file of req.files.images) {
          const imagePath = file.path;
          const imageId = nanoid(8);

          // Insert image reference to database
          await db.execute(
            `INSERT INTO request_images (image_id, request_id, image_path, created_at)
            VALUES (?, ?, ?, NOW())`,
            [imageId, requestId, imagePath]
          );

          uploadedImages.push({
            imageId,
            path: imagePath,
          });
        }
      }

      res.status(201).json({
        success: true,
        message: "Buyer request created successfully",
        data: {
          requestId,
          images: uploadedImages,
        },
      });
    } catch (error) {
      console.error("Error creating buyer request:", error);

      // If there was an error, clean up any uploaded files
      if (req.files && req.files.images) {
        req.files.images.forEach((file) => {
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
        SELECT image_id, image_path FROM request_images 
        WHERE request_id = ?
      `,
        [request.request_id]
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
      `
      SELECT * FROM buyer_requests 
      WHERE request_id = ?
    `,
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
      SELECT image_id, image_path FROM request_images 
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

export default router;
