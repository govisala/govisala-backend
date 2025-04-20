import { Router } from "express";
import { nanoid } from "nanoid";
import db from "../db/dbConn.js";
import fs from "fs";
import upload from "../storage/storage.js";

const router = Router();

// Post buyer request
router.post(
  "/post-seller-listing",
  upload.fields([{ name: "sellerListingImages", maxCount: 5 }]),
  async (req, res) => {
    try {
      const {
        ItemName,
        Quantity,
        Quality,
        Location,
        Area,
        HarvestDate,
        UnitPrice,
        Addi,
        UserId,
      } = req.body;

      // Insert the main request data into the database
      const [result] = await db.execute(
        `INSERT INTO seller_listings (user_id, item_name, quantity, quality_grade, location, area, harvest_date, unit_price, additional_notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          UserId,
          ItemName,
          Quantity,
          Quality,
          Location,
          Area,
          HarvestDate,
          UnitPrice,
          Addi,
        ]
      );

      // Process uploaded images if any - CORRECTED FIELD NAME HERE
      const uploadedImages = [];
      if (req.files && req.files.sellerListingImages) {
        // Changed from 'images' to 'sellerListingImages'
        for (const file of req.files.sellerListingImages) {
          // Changed from 'images' to 'sellerListingImages'
          const imagePath = file.path;

          // Insert image reference to database
          await db.execute(
            `INSERT INTO seller_listings_images (listing_id, image_path, created_at)
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
        message: "Seller listing created successfully",
        data: {
          result: result.insertId,
          images: uploadedImages,
        },
      });
    } catch (error) {
      console.error("Error creating Seller listing:", error);

      // If there was an error, clean up any uploaded files
      if (req.files && req.files.sellerListingImages) {
        // Changed from 'images' to 'sellerListingImages'
        req.files.sellerListingImages.forEach((file) => {
          // Changed from 'images' to 'sellerListingImages'
          fs.unlink(file.path, (err) => {
            if (err) console.error("Error deleting file:", err);
          });
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to create Seller listing",
        error: error.message,
      });
    }
  }
);

// Get all seller listings
router.get("/seller-listings", async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT * FROM seller_listings 
      ORDER BY created_at DESC
    `);

    // Fetch images for each listing
    for (let listing of rows) {
      const [images] = await db.execute(
        `
        SELECT id, image_path FROM seller_listings_images 
        WHERE listing_id = ?
      `,
        [listing.id]
      );

      listing.images = images;
    }

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching seller listings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch seller listings",
      error: error.message,
    });
  }
});

// Get a single seller listing by ID
router.get("/seller-listing/:listingId", async (req, res) => {
  try {
    const { listingId } = req.params;

    const [rows] = await db.execute(
      `
      SELECT * FROM seller_listings 
      WHERE id = ?
    `,
      [listingId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Seller listing not found",
      });
    }

    // Fetch images for the listing
    const [images] = await db.execute(
      `
      SELECT id, image_path FROM seller_listings_images 
      WHERE listing_id = ?
    `,
      [listingId]
    );

    rows[0].images = images;

    res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("Error fetching seller listing:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch seller listing",
      error: error.message,
    });
  }
});

// delete seller listing by ID
router.delete("/delete-listing/:listingId", async (req, res) => {
  try {
    const { listingId } = req.params;

    // Delete images associated with the listing
    const [images] = await db.execute(
      `
      SELECT image_path FROM seller_listings_images 
      WHERE listing_id = ?
    `,
      [listingId]
    );

    for (const image of images) {
      fs.unlink(image.image_path, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
    }

    // Delete the listing
    await db.execute(
      `
      DELETE FROM seller_listings 
      WHERE id = ?
    `,
      [listingId]
    );

    res.json({
      success: true,
      message: "Seller listing deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting seller listing:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete seller listing",
      error: error.message,
    });
  }
});

export default router;
