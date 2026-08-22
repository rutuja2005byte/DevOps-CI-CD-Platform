"use client";

import { useCallback, useEffect, useState } from "react";

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
    port?: string;
    health?: string;
    status?: string;
  };
};

type DeploymentPayload = {
  ok: boolean;
  status?: string;
  version?: string;
  branch?: string;
  build?: string;
  error?: string;
};

const REFRESH_MS = 8_000;

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  return (await response.json()) as T;
}

export default function Home() {
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [container, setContainer] = useState<ContainerPayload | null>(null);
  const [deployment, setDeployment] = useState<DeploymentPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string | null>(null);
  const [logsOpen, setLogsOpen] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [statusData, containerData, deploymentData] = await Promise.all([
        fetchJson<StatusPayload>("/api/status"),
        fetchJson<ContainerPayload>("/api/container"),
        fetchJson<DeploymentPayload>("/api/deployment"),
      ]);

      setStatus(statusData);
      setContainer(containerData);
      setDeployment(deploymentData);
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

  async function viewLogs() {
    setLogsOpen(true);
    setLogsLoading(true);
    setLogsError(null);

    try {
      const data = await fetchJson<{ ok: boolean; logs?: string; error?: string }>(
        "/api/logs"
      );

      if (!data.ok) {
        setLogs("");
        setLogsError(data.error || "Logs are unavailable.");
        return;
      }

      setLogs(data.logs || "(no log output)");
    } catch {
      setLogs("");
      setLogsError("Could not load Docker logs.");
    } finally {
      setLogsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">

        <header className="mb-10">
          <h1 className="text-4xl font-bold">
            DevOps Deployment Dashboard
          </h1>

          <p className="text-gray-400 mt-2">
            CI/CD Platform Monitoring
          </p>

          <p className="text-gray-500 text-sm mt-2">
            {loading
              ? "Loading live status…"
              : updatedAt
                ? `Last updated ${updatedAt} · auto-refresh every 8s`
                : "Waiting for live status"}
          </p>
        </header>

        {error ? (
          <p className="mb-8 text-red-400">
            {error}
          </p>
        ) : null}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatusCard
            title="Application"
            status={loading ? "LOADING" : status?.application || "UNAVAILABLE"}
          />

          <StatusCard
            title="Docker"
            status={loading ? "LOADING" : status?.docker || "UNAVAILABLE"}
          />

          <StatusCard
            title="Jenkins"
            status={loading ? "LOADING" : status?.jenkins || "UNAVAILABLE"}
          />
        </section>

        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">
            Latest Deployment
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Info
              label="Status"
              value={loading ? "LOADING" : deployment?.status || "UNAVAILABLE"}
            />
            <Info
              label="Version"
              value={loading ? "LOADING" : deployment?.version || "unavailable"}
            />
            <Info
              label="Branch"
              value={loading ? "LOADING" : deployment?.branch || "unavailable"}
            />
            <Info
              label="Build"
              value={loading ? "LOADING" : deployment?.build || "unavailable"}
            />
          </div>

          {!loading && deployment && !deployment.ok ? (
            <p className="text-amber-400 text-sm mt-4">
              {deployment.error || "Jenkins deployment details are unavailable. Showing Docker data where possible."}
            </p>
          ) : null}
        </section>

        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">
            Container
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Info
              label="Container"
              value={loading ? "LOADING" : container?.container?.name || "unavailable"}
            />
            <Info
              label="Port"
              value={loading ? "LOADING" : container?.container?.port || "unavailable"}
            />
            <Info
              label="Health"
              value={loading ? "LOADING" : container?.container?.health || status?.health || "UNAVAILABLE"}
            />
          </div>

          {!loading && container && !container.ok ? (
            <p className="text-amber-400 text-sm mt-4">
              {container.error || "Container inspect failed. Is Docker running on this machine?"}
            </p>
          ) : null}
        </section>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={refresh}
            className="px-5 py-3 rounded-lg bg-white text-black font-medium"
          >
            Refresh
          </button>

          <button
            type="button"
            onClick={viewLogs}
            className="px-5 py-3 rounded-lg border border-gray-700"
          >
            View Logs
          </button>
        </div>

        {logsOpen ? (
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                Application Logs
              </h2>
              <button
                type="button"
                onClick={() => setLogsOpen(false)}
                className="text-sm text-gray-400"
              >
                Close
              </button>
            </div>

            {logsLoading ? (
              <p className="text-gray-400">Loading Docker logs…</p>
            ) : logsError ? (
              <p className="text-red-400">{logsError}</p>
            ) : (
              <pre className="text-sm text-gray-300 whitespace-pre-wrap overflow-auto max-h-96">
                {logs}
              </pre>
            )}
          </section>
        ) : null}

      </div>
    </main>
  );
}

function statusTone(status: string): string {
  const value = status.toUpperCase();

  if (["RUNNING", "UP", "SUCCESS", "HEALTHY"].includes(value)) {
    return "bg-green-500";
  }

  if (["DOWN", "FAILURE", "UNHEALTHY", "DEAD"].includes(value)) {
    return "bg-red-500";
  }

  if (value === "LOADING") {
    return "bg-gray-500";
  }

  return "bg-amber-500";
}

function StatusCard({
  title,
  status,
}: {
  title: string;
  status: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <p className="text-gray-400 mb-3">
        {title}
      </p>

      <div className="flex items-center gap-3">
        <span className={`h-3 w-3 rounded-full ${statusTone(status)}`} />
        <span className="text-xl font-semibold">
          {status}
        </span>
      </div>
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-gray-500 text-sm">
        {label}
      </p>
      <p className="text-lg font-medium mt-1">
        {value}
      </p>
    </div>
  );
}
