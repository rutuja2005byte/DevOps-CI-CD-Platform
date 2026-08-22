import {
  appHealth,
  CD_CONTAINER,
  hostPort,
  publicError,
  resolveAppContainer,
} from "@/lib/infra";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { name, inspect } = await resolveAppContainer();
    const port = hostPort(inspect);
    const dockerHealth = inspect.State?.Health?.Status;
    const httpHealth = await appHealth(port);

    const health =
      dockerHealth && dockerHealth !== "unknown"
        ? dockerHealth.toUpperCase()
        : httpHealth;

    return Response.json({
      ok: true,
      container: {
        name,
        image: inspect.Config?.Image ?? "unavailable",
        status: inspect.State?.Status?.toUpperCase() ?? "UNKNOWN",
        running: Boolean(inspect.State?.Running),
        health,
        startedAt: inspect.State?.StartedAt ?? null,
        port: port ? `${port} → 3000` : "unavailable",
      },
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        container: {
          name: CD_CONTAINER,
          status: "UNAVAILABLE",
          running: false,
          health: "UNAVAILABLE",
          port: "unavailable",
        },
        error: publicError(error),
      },
      { status: 503 }
    );
  }
}
