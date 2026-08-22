"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

type StatusPayload = {
  ok: boolean;
  application?: string;
  docker?: string;
  jenkins?: string;
  health?: string;
  error?: string;
};

type ContainerPayload = {
  ok: boolean;
  error?: string;
  container?: {
    name?: string;
    id?: string;
    image?: string;
    port?: string;
    health?: string;
    status?: string;
    uptime?: string;
    restarts?: number;
    restartPolicy?: string;
    exitCode?: number;
    network?: string;
    ip?: string;
    command?: string;
    cpu?: string;
    memory?: string;
    memoryPercent?: string;
    networkIO?: string;
    pids?: string;
  };
};

type DeploymentPayload = {
  ok: boolean;
  status?: string;
  version?: string;
  branch?: string;
  build?: string;
  source?: string;
  error?: string;
};

type LogsPayload = {
  ok: boolean;
  logs?: string;
  error?: string;
  summary?: {
    lineCount: number;
    errorCount: number;
    warningCount: number;
    lastTimestamp: string | null;
    lastError: string | null;
    recentErrors: string[];
  };
};

const REFRESH_MS = 8_000;

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  return (await response.json()) as T;
}

function display(value: string | number | null | undefined, loading: boolean): string {
  if (loading) return "…";
  if (value === 0) return "0";
  if (value == null || value === "") return "unavailable";
  return String(value);
}

function formatLogTime(value: string | null | undefined): string {
  if (!value) return "unavailable";
  const trimmed = value.replace(/(\.\d{3})\d+/, "$1");
  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) return value;
  return new Date(parsed).toLocaleString();
}

export default function Home() {
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [container, setContainer] = useState<ContainerPayload | null>(null);
  const [deployment, setDeployment] = useState<DeploymentPayload | null>(null);
  const [logsData, setLogsData] = useState<LogsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [statusData, containerData, deploymentData, logs] = await Promise.all([
        fetchJson<StatusPayload>("/api/status"),
        fetchJson<ContainerPayload>("/api/container"),
        fetchJson<DeploymentPayload>("/api/deployment"),
        fetchJson<LogsPayload>("/api/logs"),
      ]);

      setStatus(statusData);
      setContainer(containerData);
      setDeployment(deploymentData);
      setLogsData(logs);
      setUpdatedAt(new Date().toLocaleTimeString());
      setError(null);
    } catch {
      setError("Could not load dashboard data from the Next.js API.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => {
      void refresh();
    }, 0);
    const timer = window.setInterval(() => {
      void refresh();
    }, REFRESH_MS);

    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [refresh]);

  const runtime = container?.container;
  const summary = logsData?.summary;

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-5 py-8 md:px-8">
        <header className="mb-10 flex flex-col gap-4 border-b border-white/15 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-white/45">
              CI / CD operations
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              Deployment dashboard
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">
              Live view of the application container, health check, Jenkins deploy, and Docker logs.
            </p>
          </div>
          <div className="flex items-center gap-4 font-mono text-xs text-white/50">
            <span className="inline-flex items-center gap-2 text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              {loading ? "SYNCING" : "LIVE"}
            </span>
            <span>
              {updatedAt ? `Updated ${updatedAt}` : "Waiting"} · auto 8s
            </span>
          </div>
        </header>

        {error ? (
          <p className="mb-6 border border-white px-4 py-3 text-sm">
            {error}
          </p>
        ) : null}

        <section className="mb-8 grid grid-cols-1 gap-px bg-white/15 md:grid-cols-3">
          <StatusCard
            title="Application"
            hint="Container + /health"
            status={loading ? "LOADING" : status?.application || "UNAVAILABLE"}
          />
          <StatusCard
            title="Docker"
            hint="Local daemon"
            status={loading ? "LOADING" : status?.docker || "UNAVAILABLE"}
          />
          <StatusCard
            title="Jenkins"
            hint="CD controller"
            status={loading ? "LOADING" : status?.jenkins || "UNAVAILABLE"}
          />
        </section>

        <section className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <article>
            <SectionLabel>Latest deployment</SectionLabel>
            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              <Info label="Status" value={display(deployment?.status, loading)} badge />
              <Info label="Image tag" value={display(deployment?.version, loading)} />
              <Info label="Branch" value={display(deployment?.branch, loading)} />
              <Info label="Build" value={display(deployment?.build, loading)} />
              <Info label="Source" value={display(deployment?.source, loading)} />
            </div>
            {!loading && deployment && !deployment.ok ? (
              <p className="mt-4 text-sm text-white/50">
                {deployment.error || "Jenkins details unavailable. Image tag is read from Docker."}
              </p>
            ) : null}
          </article>

          <article>
            <SectionLabel>Runtime</SectionLabel>
            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              <Info label="Container" value={display(runtime?.name, loading)} />
              <Info label="ID" value={display(runtime?.id, loading)} />
              <Info label="Status" value={display(runtime?.status, loading)} badge />
              <Info
                label="Health"
                value={display(runtime?.health || status?.health, loading)}
                badge
              />
              <Info label="Port map" value={display(runtime?.port, loading)} />
              <Info label="Uptime" value={display(runtime?.uptime, loading)} />
            </div>
            {!loading && container && !container.ok ? (
              <p className="mt-4 text-sm text-white/50">
                {container.error || "Container inspect failed. Is Docker running on this machine?"}
              </p>
            ) : null}
          </article>
        </section>

        <section className="mb-8">
          <SectionLabel>Container details</SectionLabel>
          <div className="grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4">
            <Info label="Image" value={display(runtime?.image, loading)} />
            <Info label="Restarts" value={display(runtime?.restarts, loading)} />
            <Info label="Restart policy" value={display(runtime?.restartPolicy, loading)} />
            <Info label="Exit code" value={display(runtime?.exitCode, loading)} />
            <Info label="CPU" value={display(runtime?.cpu, loading)} />
            <Info label="Memory" value={display(runtime?.memory, loading)} />
            <Info label="Network I/O" value={display(runtime?.networkIO, loading)} />
            <Info label="PIDs" value={display(runtime?.pids, loading)} />
            <Info label="Network" value={display(runtime?.network, loading)} />
            <Info label="IP" value={display(runtime?.ip, loading)} />
            <Info label="Command" value={display(runtime?.command, loading)} />
            <Info label="Mem %" value={display(runtime?.memoryPercent, loading)} />
          </div>
        </section>

        <section className="mb-8">
          <SectionLabel>Log insights</SectionLabel>
          <div className="grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4">
            <Info label="Lines scanned" value={display(summary?.lineCount, loading)} />
            <Info label="Errors" value={display(summary?.errorCount, loading)} />
            <Info label="Warnings" value={display(summary?.warningCount, loading)} />
            <Info
              label="Last log"
              value={loading ? "…" : formatLogTime(summary?.lastTimestamp)}
            />
          </div>
          {!loading && summary?.lastError ? (
            <p className="mt-5 border-t border-white/15 pt-4 font-mono text-xs leading-6 text-white/70">
              Last error: {summary.lastError}
            </p>
          ) : null}
          {!loading && logsData && !logsData.ok ? (
            <p className="mt-4 text-sm text-white/50">
              {logsData.error || "Docker logs are unavailable."}
            </p>
          ) : null}
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between">
            <SectionLabel>Docker logs</SectionLabel>
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-white/35">
              last 200 lines · live
            </p>
          </div>
          <div className="border border-white/20 bg-black">
            {loading && !logsData?.logs ? (
              <p className="px-4 py-6 font-mono text-sm text-white/40">Loading logs…</p>
            ) : (
              <pre className="max-h-[28rem] overflow-auto px-4 py-4 font-mono text-[12px] leading-6 text-white/85 whitespace-pre-wrap">
                {logsData?.logs || "(no log output)"}
              </pre>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-white/40">
      {children}
    </h2>
  );
}

function tone(status: string): "ok" | "bad" | "warn" | "muted" {
  const value = status.toUpperCase();
  if (["RUNNING", "UP", "SUCCESS", "HEALTHY"].includes(value)) return "ok";
  if (["DOWN", "FAILURE", "UNHEALTHY", "DEAD"].includes(value)) return "bad";
  if (["LOADING", "…"].includes(value)) return "muted";
  return "warn";
}

function StatusCard({
  title,
  hint,
  status,
}: {
  title: string;
  hint: string;
  status: string;
}) {
  const kind = tone(status);

  return (
    <div className="bg-black p-5">
      <p className="text-sm text-white/55">{title}</p>
      <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-white/30">
        {hint}
      </p>
      <p className="mt-6 font-mono text-2xl tracking-tight">
        {status}
      </p>
      <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-white/35">
        {kind === "ok" ? "Healthy" : kind === "bad" ? "Attention" : kind === "muted" ? "Loading" : "Unknown"}
      </p>
    </div>
  );
}

function Info({
  label,
  value,
  badge = false,
}: {
  label: string;
  value: string;
  badge?: boolean;
}) {
  const kind = tone(value);

  return (
    <div className="min-w-0">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>
      {badge ? (
        <p
          className={`mt-2 inline-flex px-2 py-1 font-mono text-xs ${
            kind === "ok"
              ? "bg-white text-black"
              : kind === "bad"
                ? "border border-white text-white"
                : "border border-white/30 text-white/60"
          }`}
        >
          {value}
        </p>
      ) : (
        <p className="mt-2 truncate font-mono text-sm text-white" title={value}>
          {value}
        </p>
      )}
    </div>
  );
}
