import {
  appHealth,
  CD_CONTAINER,
  containerIP,
  containerStats,
  formatUptime,
  hostPort,
  networkName,
  publicError,
  resolveAppContainer,
  shortId,
} from "@/lib/infra";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { name, inspect } = await resolveAppContainer();
    const port = hostPort(inspect);
    const dockerHealth = inspect.State?.Health?.Status;
    const httpHealth = await appHealth(port);
    const stats = await containerStats(name);

    const health =
      dockerHealth && dockerHealth !== "unknown"
        ? dockerHealth.toUpperCase()
        : httpHealth;

    return Response.json({
      ok: true,
      container: {
        name,
        id: shortId(inspect.Id),
        image: inspect.Config?.Image ?? "unavailable",
        status: inspect.State?.Status?.toUpperCase() ?? "UNKNOWN",
        running: Boolean(inspect.State?.Running),
        restarting: Boolean(inspect.State?.Restarting),
        health,
        startedAt: inspect.State?.StartedAt ?? null,
        uptime: formatUptime(inspect.State?.StartedAt),
        restarts: inspect.RestartCount ?? 0,
        restartPolicy: inspect.HostConfig?.RestartPolicy?.Name || "no",
        exitCode: inspect.State?.ExitCode ?? 0,
        port: port ? `${port} → 3000` : "unavailable",
        network: networkName(inspect),
        ip: containerIP(inspect),
        command: inspect.Config?.Cmd?.join(" ") || "unavailable",
        cpu: stats?.cpu ?? "unavailable",
        memory: stats?.memory ?? "unavailable",
        memoryPercent: stats?.memoryPercent ?? "unavailable",
        networkIO: stats?.networkIO ?? "unavailable",
        pids: stats?.pids ?? "unavailable",
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
