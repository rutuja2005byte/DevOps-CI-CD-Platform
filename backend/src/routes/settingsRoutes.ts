import { Router } from "express";
import { pool } from "../db/database.js";

const router = Router();

router.get("/", async (req, res) => {
  const databaseConfigured = Boolean(process.env.DATABASE_URL);
  let databaseOnline = false;

  try {
    await pool.query("SELECT 1");
    databaseOnline = true;
  } catch (error) {
    console.error(error);
  }

  res.json({
    backend: {
      port: process.env.PORT || "5001",
      databaseConfigured,
      databaseOnline
    },
    integrations: {
      githubActions: {
        configured: Boolean(process.env.GITHUB_TOKEN || process.env.GITHUB_ACTIONS)
      },
      jenkins: {
        configured: Boolean(process.env.JENKINS_URL && process.env.JENKINS_TOKEN)
      },
      docker: {
        configured: process.env.DOCKER_ENABLED === "true"
      },
      notifications: {
        configured: Boolean(
          process.env.SLACK_WEBHOOK_URL || process.env.NOTIFICATION_WEBHOOK_URL
        )
      }
    }
  });
});

export default router;
