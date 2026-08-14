import { Router } from "express";
import { pool } from "../db/database.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM builds ORDER BY created_at DESC"
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch builds"
    });
  }
});

export default router;