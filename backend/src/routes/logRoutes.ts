import { Router } from "express";
import { pool } from "../db/database.js";
import { getTableColumns, pickExistingColumn, tableExists } from "../db/schema.js";

const router = Router();

async function getLogRows(tableName: string, foreignKey?: string, id?: string) {
  if (!(await tableExists(tableName))) {
    return [];
  }

  const columns = await getTableColumns(tableName);
  const messageColumn = pickExistingColumn(columns, [
    "message",
    "log",
    "content",
    "output"
  ]);
  const timestampColumn = pickExistingColumn(columns, [
    "created_at",
    "timestamp",
    "logged_at"
  ]);

  if ((foreignKey && !columns.includes(foreignKey)) || !messageColumn) {
    return [];
  }

  const orderBy = timestampColumn ? ` ORDER BY ${timestampColumn} ASC` : "";
  const where = foreignKey && id ? ` WHERE ${foreignKey} = $1` : "";
  const values = foreignKey && id ? [id] : [];
  const result = await pool.query(
    `SELECT ${messageColumn} AS message${
      timestampColumn ? `, ${timestampColumn} AS created_at` : ""
    } FROM ${tableName}${where}${orderBy}`,
    values
  );

  return result.rows;
}

router.get("/", async (req, res) => {
  try {
    const buildLogs = await getLogRows("build_logs");
    const deploymentLogs = await getLogRows("deployment_logs");

    return res.json({ buildLogs, deploymentLogs });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch logs" });
  }
});

router.get("/builds/:id", async (req, res) => {
  try {
    const logs = await getLogRows("build_logs", "build_id", req.params.id);
    return res.json(logs);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch build logs" });
  }
});

router.get("/deployments/:id", async (req, res) => {
  try {
    const logs = await getLogRows(
      "deployment_logs",
      "deployment_id",
      req.params.id
    );
    return res.json(logs);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch deployment logs" });
  }
});

export default router;
