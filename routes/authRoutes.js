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
      const user_id = nanoid(10);
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
        `INSERT INTO users (user_id,user_mail, user_name, user_tele, user_address, user_district, 
        user_role, user_pwd, user_img, user_docs, user_status, user_createdAt) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          user_id,
          email,
          name,
          contactNumber,
          address,
          district,
          userRole,
          hashedPassword,
          profileImagePath,
          idDocumentPath,
          "pending", // Default status - pending verification
        ]
      );
      // Return success response
      res.status(201).json({
        message:
          "Registration successful! Your account is pending verification.",
        user_id: user_id,
      });
    } catch (error) {
      // Rollback transaction on error
      await db.rollback();

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

// Admin login
router.post("/admin/login", async (req, res) => {
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

    if (rows[0].user_status === "pending") {
      return res.status(403).json({
        message:
          "Your account is pending verification. Please check back later.",
      });
    } else if (rows[0].user_status === "rejected") {
      return res.status(403).json({
        message: "Your account has been rejected. Please contact support.",
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
router.post("/otp-test", async (req, res) => {
  try {
    const { user_mail, user_name } = req.body;
    const otpCode = Math.floor(100000 + Math.random() * 900000);
    await otpMail({ to: user_mail, otpCode, userName: user_name });
    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
