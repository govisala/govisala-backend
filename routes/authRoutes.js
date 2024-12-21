import { Router } from "express";
import { nanoid } from "nanoid";
import bcrypt from "bcrypt";
import db from "../db/dbConn.js";

const router = Router();

// Register a new user
router.post("/register", async (req, res) => {
  try {
    let user_id = nanoid(10);
    const {
      user_name,
      user_mail,
      user_pwd,
      user_role,
      user_address,
      user_district,
      user_tele,
    } = req.body;
    const hashPwd = await bcrypt.hash(user_pwd, 10);
    const query = `INSERT INTO users (user_id, user_name, user_mail, user_pwd, user_role, user_address, user_district, user_tele) VALUES (?,?,?,?,?,?,?,?)`;
    const [rows] = await db.query(query, [
      user_id,
      user_name,
      user_mail,
      hashPwd,
      user_role,
      user_address,
      user_district,
      user_tele,
    ]);
    res.status(200).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// login
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
    res.status(200).json({ message: "User logged in successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
