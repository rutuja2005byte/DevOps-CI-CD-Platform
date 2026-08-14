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

router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM builds WHERE id = $1", [
      req.params.id
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Build not found" });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to fetch build"
    });
  }
});

export default router;
