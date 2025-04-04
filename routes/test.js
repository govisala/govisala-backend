import { Router } from "express";
import db from "../db/dbConn.js";
import multer from "multer";

const router = Router();
const upload = multer();

// fetch chat history
router.get("/chat/:bid_id", async (req, res) => {
  try {
    const { bid_id } = req.params;
    const query = `SELECT * FROM messages WHERE bid_id = ?`;
    const [rows] = await db.query(query, [bid_id]);
    return res
      .status(200)
      .json({ message: "Chat history fetched successfully", data: rows });
  } catch (err) {
    console.log(err);

    res.status(500).json(err);
  }
});

router.post("/form-data-test", upload.any(), (req, res) => {
  console.log(req.body);
  res.status(200).json({ message: "success" });
});

export default router;
