import { Router } from "express";
import db from "../db/dbConn.js";

const router = Router();

router.post("/post-notifi", async (req, res) => {
  try {
    const { noti_title, noti_content } = req.body;

    const query = `INSERT INTO noti (noti_title, noti_content) VALUES (?,?)`;
    const [rows] = await db.query(query, [noti_title, noti_content]);

    return res
      .status(200)
      .json({ message: "Notification posted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/get-notifi", async (req, res) => {
  try {
    const query = `SELECT * FROM noti WHERE displayed = 0`;
    const [rows] = await db.query(query);
    return res
      .status(200)
      .json({ message: "Notification fetched successfully", data: rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/update-notifi", async (req, res) => {
  try {
    const { noti_id } = req.body;

    const query = `UPDATE noti SET displayed = 1 WHERE noti_id = ?`;
    const [rows] = await db.query(query, [noti_id]);

    return res
      .status(200)
      .json({ message: "Notification updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
