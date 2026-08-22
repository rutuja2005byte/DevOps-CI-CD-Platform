import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export async function GET() {
  try {
    const { stdout } = await execFileAsync("docker", [
      "inspect",
      "--format",
      "{{json .}}",
      "devops-platform-cd",
    ]);

    const container = JSON.parse(stdout);

    return Response.json({
      success: true,
      container: {
        name: container.Name.replace("/", ""),
        image: container.Config.Image,
        status: container.State.Status,
        running: container.State.Running,
        health: container.State.Health?.Status || "unknown",
        startedAt: container.State.StartedAt,
      },
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        container: {
          name: "devops-platform-cd",
          status: "stopped",
          running: false,
          health: "down",
        },
      },
      { status: 500 }
    );
  }
}