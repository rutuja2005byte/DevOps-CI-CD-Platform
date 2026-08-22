import {
  appHealth,
  dockerDaemonUp,
  hostPort,
  jenkinsReachable,
  publicError,
  resolveAppContainer,
} from "@/lib/infra";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const docker = (await dockerDaemonUp()) ? "RUNNING" : "DOWN";

    let application = "UNAVAILABLE";
    let health: "UP" | "DOWN" | "UNAVAILABLE" = "UNAVAILABLE";
    let container = "unavailable";
    let running = false;

    if (docker === "RUNNING") {
      try {
        const resolved = await resolveAppContainer();
        container = resolved.name;
        running = Boolean(resolved.inspect.State?.Running);
        health = await appHealth(hostPort(resolved.inspect));

        if (running && health === "UP") {
          application = "RUNNING";
        } else if (running) {
          application = health === "UNAVAILABLE" ? "RUNNING" : "UNHEALTHY";
        } else {
          application = "DOWN";
          if (health === "UNAVAILABLE") health = "DOWN";
        }
      } catch {
        application = "DOWN";
        health = await appHealth(null);
        if (health === "UP") application = "RUNNING";
      }
    } else {
      health = await appHealth(null);
      if (health === "UP") application = "RUNNING";
      else application = "DOWN";
    }

    const jenkins = (await jenkinsReachable()) ? "RUNNING" : "DOWN";

    return Response.json({
      ok: true,
      application,
      docker,
      jenkins,
      health,
      container,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        application: "UNAVAILABLE",
        docker: "UNAVAILABLE",
        jenkins: "UNAVAILABLE",
        health: "UNAVAILABLE",
        error: publicError(error),
      },
      { status: 503 }
    );
  }
}
