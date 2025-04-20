import { Router } from "express";
import { nanoid } from "nanoid";
import bcrypt from "bcrypt";
import db from "../db/dbConn.js";

import otpMail from "../smtp/template.js";

const router = Router();

// Admin login
router.post("/login", async (req, res) => {
  try {
    const { admin_mail, admin_pwd } = req.body;

    // Sample mail and password for admin login
    let mail = "admin@govisala.lk";
    let password = "admin123";
    if (admin_mail !== mail || admin_pwd !== password) {
      return res.status(400).json({ message: "Invalid credentials" });
    } else {
      return res.status(200).json({
        message: "Admin logged in successfully",
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//retrieve all users
router.get("/users", async (req, res) => {
  try {
    const query = `SELECT * FROM users`;
    const [rows] = await db.query(query);
    if (rows.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verify user by admin using user_id
router.post("/verify-user", async (req, res) => {
  try {
    const { user_id } = req.body;

    // Check if the user exists
    const query = `SELECT * FROM users WHERE user_id = ?`;
    const [rows] = await db.query(query, [user_id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update the user's status to verified
    const updateQuery = `UPDATE users SET user_status = 'verified' WHERE user_id = ?`;
    await db.query(updateQuery, [user_id]);

    res.status(200).json({ message: "User verified successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// delete user by admin using user_id
router.delete("/delete-user/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    // Delete the user
    const deleteQuery = `DELETE FROM users WHERE user_id = ?`;
    const [rows] = await db.query(deleteQuery, [user_id]);
    // Check if the user was deleted
    if (rows.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// edit user by admin using user_id
router.put("/edit-user", async (req, res) => {
  try {
    const {
      user_id,
      user_name,
      user_mail,
      user_role,
      user_status,
      user_tele,
      user_address,
      user_district,
    } = req.body;
    if (!user_id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Check if the user exists
    const query = `SELECT * FROM users WHERE user_id = ?`;

    const [rows] = await db.query(query, [user_id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    // Update the user's details
    const updateQuery = `UPDATE users SET user_name = ?, user_mail = ?, user_role = ?, user_status = ?, user_tele = ?, user_address = ?, user_district = ? WHERE user_id = ?`;

    await db.query(updateQuery, [
      user_name,
      user_mail,
      user_role,
      user_status,
      user_tele,
      user_address,
      user_district,
      user_id,
    ]);

    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// list all seller listings and their images
router.get("/seller-listings", async (req, res) => {
  try {
    const query = `
      SELECT sl.*, GROUP_CONCAT(sli.image_path) AS images
      FROM seller_listings sl
      LEFT JOIN seller_listings_images sli ON sl.id = sli.listing_id
      GROUP BY sl.id
    `;
    const [rows] = await db.query(query);
    if (rows.length === 0) {
      return res.status(404).json({ message: "No seller listings found" });
    }
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update seller listing status
router.put("/update-seller-listing", async (req, res) => {
  try {
    const { listing_id, status } = req.body;

    // Check if the listing exists
    const query = `SELECT * FROM seller_listings WHERE id = ?`;
    const [rows] = await db.query(query, [listing_id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Listing not found" });
    }

    // Update the listing's status
    const updateQuery = `UPDATE seller_listings SET status = ? WHERE id = ?`;
    await db.query(updateQuery, [status, listing_id]);

    res.status(200).json({ message: "Listing status updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete seller listing
router.delete("/delete-seller-listing/:listingId", async (req, res) => {
  try {
    const { listingId } = req.params;

    // Delete images associated with the listing
    const deleteImagesQuery = `DELETE FROM seller_listings_images WHERE listing_id = ?`;
    await db.query(deleteImagesQuery, [listingId]);

    // Delete the listing
    const deleteListingQuery = `DELETE FROM seller_listings WHERE id = ?`;
    const [rows] = await db.query(deleteListingQuery, [listingId]);

    // Check if the listing was deleted
    if (rows.affectedRows === 0) {
      return res.status(404).json({ message: "Listing not found" });
    }

    res.status(200).json({ message: "Listing deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Approve seller listing
router.post("/approve-seller-listing", async (req, res) => {
  try {
    const { listing_id } = req.body;

    // Check if the listing exists
    const query = `SELECT * FROM seller_listings WHERE id = ?`;
    const [rows] = await db.query(query, [listing_id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Listing not found" });
    }

    // Update the listing's status to approved
    const updateQuery = `UPDATE seller_listings SET status = 'approved' WHERE id = ?`;
    await db.query(updateQuery, [listing_id]);

    res.status(200).json({ message: "Listing approved successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reject seller listing
router.post("/reject-seller-listing", async (req, res) => {
  try {
    const { listing_id } = req.body;

    // Check if the listing exists
    const query = `SELECT * FROM seller_listings WHERE id = ?`;
    const [rows] = await db.query(query, [listing_id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Listing not found" });
    }

    // Update the listing's status to rejected
    const updateQuery = `UPDATE seller_listings SET status = 'rejected' WHERE id = ?`;
    await db.query(updateQuery, [listing_id]);

    res.status(200).json({ message: "Listing rejected successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Retrieve all buyer requests
router.get("/buyer-requests", async (req, res) => {
  try {
    const query = `SELECT * FROM buyer_requests`;
    const [rows] = await db.query(query);
    if (rows.length === 0) {
      return res.status(404).json({ message: "No buyer requests found" });
    }
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// update-listing-status/2
router.put("/update-listing-status/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Check if the listing exists
    const query = `SELECT * FROM seller_listings WHERE id = ?`;
    const [rows] = await db.query(query, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Listing not found" });
    }

    // Update the listing's status
    const updateQuery = `UPDATE seller_listings SET status = ? WHERE id = ?`;
    await db.query(updateQuery, [status, id]);

    res.status(200).json({ message: "Listing status updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
