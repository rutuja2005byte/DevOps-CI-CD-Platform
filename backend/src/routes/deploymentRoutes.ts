import { Router } from "express";
import { pool } from "../db/database.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM deployments ORDER BY deployed_at DESC"
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch deployments"
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM deployments WHERE id = $1", [
      req.params.id
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Deployment not found" });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to fetch deployment"
    });
  }
});

router.post("/:id/rollback", async (req, res) => {
  try {
    if (!process.env.DEPLOY_ROLLBACK_COMMAND) {
      return res.status(501).json({
        configured: false,
        message: "Rollback is not configured for this backend."
      });
    }

    const result = await pool.query("SELECT * FROM deployments WHERE id = $1", [
      req.params.id
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Deployment not found" });
    }

    return res.json({
      configured: true,
      message: "Rollback command is configured but execution is disabled until an operator wires the command runner."
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to start rollback"
    });
  }
});

export default router;
