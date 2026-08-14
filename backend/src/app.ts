import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes.js";
import deploymentRoutes from "./routes/deploymentRoutes.js";
import buildRoutes from "./routes/buildRoutes.js";
import pipelineRoutes from "./routes/pipelineRoutes.js";
import containerRoutes from "./routes/containerRoutes.js";
import logRoutes from "./routes/logRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import { pool } from "./db/database.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      status: "ok",
      service: "devops-cicd-backend",
      database: "online",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);

    res.status(503).json({
      status: "error",
      service: "devops-cicd-backend",
      database: "offline",
      timestamp: new Date().toISOString()
    });
  }
});

app.use("/api/users", userRoutes);
app.use("/api/deployments", deploymentRoutes);
app.use("/api/builds", buildRoutes);
app.use("/api/pipelines", pipelineRoutes);
app.use("/api/containers", containerRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/settings", settingsRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
