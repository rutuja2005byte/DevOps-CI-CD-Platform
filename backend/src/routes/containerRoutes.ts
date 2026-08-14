import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { Router } from "express";

const execFileAsync = promisify(execFile);
const router = Router();

interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: string;
  port: string;
}

router.get("/", async (req, res) => {
  try {
    const { stdout } = await execFileAsync("docker", [
      "ps",
      "-a",
      "--format",
      "{{json .}}"
    ]);

    const containers: DockerContainer[] = stdout
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const container = JSON.parse(line) as {
          ID: string;
          Names: string;
          Image: string;
          Status: string;
          Ports: string;
        };

        return {
          id: container.ID,
          name: container.Names,
          image: container.Image,
          status: container.Status,
          port: container.Ports || "Not exposed"
        };
      });

    return res.json({ configured: true, containers });
  } catch (error) {
    console.error(error);
    return res.json({
      configured: false,
      message: "Docker is not configured or not available to the backend.",
      containers: []
    });
  }
});

export default router;
