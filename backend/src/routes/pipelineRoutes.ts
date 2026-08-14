import { Router } from "express";
import { pool } from "../db/database.js";
import { tableExists } from "../db/schema.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    if (await tableExists("pipelines")) {
      const result = await pool.query("SELECT * FROM pipelines ORDER BY id DESC");
      return res.json(result.rows);
    }

    if (!(await tableExists("builds"))) {
      return res.json([]);
    }

    const result = await pool.query(
      `SELECT
         branch AS id,
         branch AS name,
         branch,
         (ARRAY_AGG(status ORDER BY created_at DESC))[1] AS status,
         (ARRAY_AGG(build_number ORDER BY created_at DESC))[1] AS latest_build,
         (ARRAY_AGG(duration ORDER BY created_at DESC))[1] AS duration,
         MAX(created_at) AS updated_at
       FROM builds
       GROUP BY branch
       ORDER BY MAX(created_at) DESC`
    );

    return res.json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch pipelines" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (await tableExists("pipelines")) {
      const result = await pool.query("SELECT * FROM pipelines WHERE id::text = $1", [
        id
      ]);

      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Pipeline not found" });
      }

      return res.json(result.rows[0]);
    }

    const builds = await pool.query(
      "SELECT * FROM builds WHERE branch = $1 ORDER BY created_at DESC",
      [id]
    );

    if (builds.rowCount === 0) {
      return res.status(404).json({ message: "Pipeline not found" });
    }

    return res.json({
      id,
      name: id,
      branch: id,
      status: builds.rows[0].status,
      latest_build: builds.rows[0].build_number,
      duration: builds.rows[0].duration,
      builds: builds.rows
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch pipeline" });
  }
});

export default router;
