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

export default router;
