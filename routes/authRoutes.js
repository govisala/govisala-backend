import { Router } from "express";
import { nanoid } from "nanoid";
import bcrypt from "bcrypt";
import db from "../db/dbConn.js";
import fs from "fs";

import upload from "../storage/storage.js";
import otpMail from "../smtp/template.js";

const router = Router();

// Register a new user
router.post(
  "/register",
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "idDocument", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        email,
        name,
        contactNumber,
        address,
        district,
        userRole,
        password,
      } = req.body;
      // Validate required fields
      if (
        !email ||
        !name ||
        !contactNumber ||
        !address ||
        !district ||
        !userRole ||
        !password
      ) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Ensure ID document is uploaded
      if (!req.files.idDocument) {
        return res.status(400).json({
          message: "National ID or Business Registration document is required",
        });
      }

      // Check if user already exists
      const [existingUsers] = await db.query(
        "SELECT * FROM users WHERE user_mail = ?",
        [email]
      );

      if (existingUsers.length > 0) {
        return res
          .status(409)
          .json({ message: "User with this email already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Prepare file paths
      const profileImagePath = req.files.profileImage
        ? req.files.profileImage[0].path.replace(/\\/g, "/")
        : null;

      const idDocumentPath = req.files.idDocument[0].path.replace(/\\/g, "/");

      // Insert user into database
      const [result] = await db.query(
        `INSERT INTO users(user_mail, user_name, user_tele, user_address, user_district,user_role, user_pwd, user_img, user_docs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          email,
          name,
          contactNumber,
          address,
          district,
          userRole,
          hashedPassword,
          profileImagePath,
          idDocumentPath,
        ]
      );

      //verify if the user is inserted
      if (result.affectedRows === 0) {
        return res.status(500).json({ message: "User registration failed" });
      }
      // Send OTP email
      const otpCode = Math.floor(100000 + Math.random() * 900000);

      await otpMail({ to: email, otpCode, userName: name });
      // Return success response
      // send OTP code to the db
      const otpQuery = `INSERT INTO registerOTP (user_id, user_mail, otp) VALUES (?, ?, ?)`;
      db.query(otpQuery, [result.insertId, email, otpCode], (err) => {
        if (err) {
          console.error("Error inserting OTP into database:", err);
        }
      });
      res.status(201).json({
        message:
          "Registration successful! Your account is pending verification.",
        user_id: result.insertId,
      });
    } catch (error) {
      // Rollback transaction on error
      // await db.rollback();

      console.error("Registration error:", error);

      // Clean up uploaded files if registration failed
      if (req.files) {
        if (req.files.profileImage) {
          fs.unlink(req.files.profileImage[0].path, (err) => {
            if (err) console.error("Error deleting profile image:", err);
          });
        }
        if (req.files.idDocument) {
          fs.unlink(req.files.idDocument[0].path, (err) => {
            if (err) console.error("Error deleting ID document:", err);
          });
        }
      }

      res
        .status(500)
        .json({ message: "Registration failed. Please try again later." });
    }
  }
);

// User - login
router.post("/login", async (req, res) => {
  try {
    const { user_mail, user_pwd } = req.body;
    const query = `SELECT * FROM users WHERE user_mail = ?`;
    const [rows] = await db.query(query, [user_mail]);
    if (rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const hashedPwd = rows[0].user_pwd;
    const isValid = await bcrypt.compare(user_pwd, hashedPwd);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (rows[0].user_otp_verified == 0) {
      return res.status(403).json({
        message:
          "Please verify OTP before logging in. Check your email for the OTP.",
      });
    } else {
      return res.status(200).json({
        message: "User logged in successfully",
        userData: rows[0],
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// OTP Test
router.post("/otp-verify", async (req, res) => {
  try {
    const { otp, user_id } = req.body;
    const query = `SELECT * FROM registerOTP WHERE user_id = ? AND otp = ?`;

    const [rows] = await db.query(query, [user_id, otp]);
    if (rows.length === 0) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const deleteQuery = `DELETE FROM registerOTP WHERE id = ?`;
    await db.query(deleteQuery, [rows[0].id]);
    const updateQuery = `UPDATE users SET user_otp_verified = 1 WHERE user_id = ?`;
    await db.query(updateQuery, [user_id]);
    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Retrieve user data by ID
router.get("/user/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    const query = `SELECT * FROM users WHERE user_id = ?`;
    const [rows] = await db.query(query, [user_id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// update password
router.put("/update-password", async (req, res) => {
  try {
    const { user_id, oldPassword, newPassword } = req.body;
    const query = `SELECT * FROM users WHERE user_id = ?`;
    const [rows] = await db.query(query, [user_id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const hashedPwd = rows[0].user_pwd;
    const isValid = await bcrypt.compare(oldPassword, hashedPwd);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    const updateQuery = `UPDATE users SET user_pwd = ? WHERE user_id = ?`;
    await db.query(updateQuery, [hashedNewPassword, user_id]);
    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// get user average rating and count of rating records for each user from ratings database
router.get("/user-rating/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    const query = `SELECT AVG(value) AS average_rating, COUNT(*) AS rating_count FROM ratings WHERE user_id = ?`;
    const [rows] = await db.query(query, [user_id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
