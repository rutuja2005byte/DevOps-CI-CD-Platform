import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET() {
  try {
    const { stdout } = await execAsync(
      "docker inspect -f '{{.State.Status}}' devops-platform-cd"
    );

    const status = stdout.trim();

    return Response.json({
      application: status === "running" ? "RUNNING" : status.toUpperCase(),
      container: "devops-platform-cd",
      docker: "RUNNING",
      health: status === "running" ? "UP" : "DOWN",
    });
  } catch (error) {
    return Response.json(
      {
        application: "DOWN",
        container: "devops-platform-cd",
        docker: "UNKNOWN",
        health: "DOWN",
      },
      { status: 500 }
    );
  }
}