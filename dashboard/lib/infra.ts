import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export const CD_CONTAINER = "devops-platform-cd";
export const COMPOSE_CONTAINER = "devops-platform-app";

const DOCKER_TIMEOUT_MS = 8_000;
const HTTP_TIMEOUT_MS = 3_000;
export const LOG_TAIL = 200;

export type DockerInspect = {
  Id?: string;
  Created?: string;
  Name?: string;
  RestartCount?: number;
  Config?: {
    Image?: string;
    Cmd?: string[];
    Hostname?: string;
  };
  State?: {
    Status?: string;
    Running?: boolean;
    Restarting?: boolean;
    ExitCode?: number;
    Error?: string;
    StartedAt?: string;
    FinishedAt?: string;
    Health?: { Status?: string };
  };
  HostConfig?: {
    RestartPolicy?: { Name?: string };
  };
  NetworkSettings?: {
    Networks?: Record<string, { IPAddress?: string } | undefined>;
    Ports?: Record<string, Array<{ HostIp?: string; HostPort?: string }> | null>;
  };
};

export type ContainerStats = {
  cpu: string;
  memory: string;
  memoryPercent: string;
  networkIO: string;
  pids: string;
};

export type LogSummary = {
  lineCount: number;
  errorCount: number;
  warningCount: number;
  lastTimestamp: string | null;
  lastError: string | null;
  recentErrors: string[];
};

function jenkinsAuthHeader(): string | undefined {
  const user = process.env.JENKINS_USER;
  const token = process.env.JENKINS_API_TOKEN;
  if (!user || !token) return undefined;
  return `Basic ${Buffer.from(`${user}:${token}`).toString("base64")}`;
}

async function runDocker(args: string[]): Promise<{ stdout: string; stderr: string }> {
  return execFileAsync("docker", args, {
    timeout: DOCKER_TIMEOUT_MS,
    maxBuffer: 2 * 1024 * 1024,
  });
}

export async function fetchJson<T>(
  url: string,
  headers?: Record<string, string>
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json", ...headers },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Request failed (${response.status})`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function dockerDaemonUp(): Promise<boolean> {
  try {
    await runDocker(["info", "-f", "{{.ServerVersion}}"]);
    return true;
  } catch {
    return false;
  }
}

export async function inspectContainer(name: string): Promise<DockerInspect> {
  const { stdout } = await runDocker(["inspect", "--format", "{{json .}}", name]);
  return JSON.parse(stdout) as DockerInspect;
}

export async function resolveAppContainer(): Promise<{
  name: string;
  inspect: DockerInspect;
}> {
  try {
    const inspect = await inspectContainer(CD_CONTAINER);
    return { name: CD_CONTAINER, inspect };
  } catch {
    const inspect = await inspectContainer(COMPOSE_CONTAINER);
    return { name: COMPOSE_CONTAINER, inspect };
  }
}

export function hostPort(inspect: DockerInspect): string | null {
  const bindings = inspect.NetworkSettings?.Ports?.["3000/tcp"];
  return bindings?.[0]?.HostPort ?? null;
}

export function imageTag(image: string | undefined): string {
  if (!image) return "unavailable";
  const digestIndex = image.indexOf("@");
  const ref = digestIndex >= 0 ? image.slice(0, digestIndex) : image;
  const lastColon = ref.lastIndexOf(":");
  const lastSlash = ref.lastIndexOf("/");
  if (lastColon > lastSlash) {
    return ref.slice(lastColon + 1);
  }
  return "latest";
}

export async function appHealth(port: string | null): Promise<"UP" | "DOWN" | "UNAVAILABLE"> {
  const candidates = [
    process.env.APP_HEALTH_URL,
    port ? `http://127.0.0.1:${port}/health` : undefined,
    "http://127.0.0.1:3001/health",
    "http://127.0.0.1:3000/health",
  ].filter((url, index, list): url is string => Boolean(url) && list.indexOf(url) === index);

  for (const url of candidates) {
    try {
      const body = await fetchJson<{ status?: string }>(url);
      return body.status === "UP" ? "UP" : "DOWN";
    } catch {
      continue;
    }
  }

  return "UNAVAILABLE";
}

export async function containerLogs(name: string): Promise<string> {
  const { stdout, stderr } = await runDocker([
    "logs",
    "--tail",
    String(LOG_TAIL),
    "--timestamps",
    name,
  ]);

  return [stdout, stderr].filter(Boolean).join("\n").trim();
}

export async function containerStats(name: string): Promise<ContainerStats | null> {
  try {
    const { stdout } = await runDocker([
      "stats",
      "--no-stream",
      "--format",
      "{{json .}}",
      name,
    ]);
    const stats = JSON.parse(stdout) as {
      CPUPerc?: string;
      MemUsage?: string;
      MemPerc?: string;
      NetIO?: string;
      PIDs?: string;
    };

    return {
      cpu: stats.CPUPerc || "unavailable",
      memory: stats.MemUsage || "unavailable",
      memoryPercent: stats.MemPerc || "unavailable",
      networkIO: stats.NetIO || "unavailable",
      pids: stats.PIDs || "unavailable",
    };
  } catch {
    return null;
  }
}

export function summarizeLogs(text: string): LogSummary {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const errorRe = /\b(error|err|fail(?:ed|ure)?|fatal|exception|unhealthy|crash)\b/i;
  const warnRe = /\bwarn(?:ing)?\b/i;
  const errors = lines.filter((line) => errorRe.test(line));
  const warnings = lines.filter((line) => warnRe.test(line) && !errorRe.test(line));
  const timestampRe = /^\d{4}-\d{2}-\d{2}T\S+/;

  let lastTimestamp: string | null = null;
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const match = lines[index].match(timestampRe);
    if (match) {
      lastTimestamp = match[0];
      break;
    }
  }

  return {
    lineCount: lines.length,
    errorCount: errors.length,
    warningCount: warnings.length,
    lastTimestamp,
    lastError: errors.at(-1) ?? null,
    recentErrors: errors.slice(-5),
  };
}

export function shortId(id: string | undefined): string {
  if (!id) return "unavailable";
  return id.replace(/^sha256:/, "").slice(0, 12);
}

export function formatUptime(startedAt: string | null | undefined): string {
  if (!startedAt || startedAt.startsWith("0001-01-01")) return "unavailable";
  const start = Date.parse(startedAt);
  if (Number.isNaN(start)) return "unavailable";

  let seconds = Math.max(0, Math.floor((Date.now() - start) / 1000));
  const days = Math.floor(seconds / 86400);
  seconds %= 86400;
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function networkName(inspect: DockerInspect): string {
  const networks = inspect.NetworkSettings?.Networks;
  const name = networks ? Object.keys(networks)[0] : undefined;
  return name || "unavailable";
}

export function containerIP(inspect: DockerInspect): string {
  const networks = inspect.NetworkSettings?.Networks;
  const first = networks ? Object.values(networks)[0] : undefined;
  return first?.IPAddress || "unavailable";
}

type JenkinsJob = {
  name: string;
  lastBuild?: { number?: number; result?: string | null; url?: string } | null;
};

type JenkinsRoot = { jobs?: JenkinsJob[] };

type JenkinsBuild = {
  number?: number;
  result?: string | null;
  url?: string;
  displayName?: string;
  actions?: Array<{
    lastBuiltRevision?: { branch?: Array<{ name?: string }> };
  }>;
};

function jenkinsHeaders(): Record<string, string> {
  const authorization = jenkinsAuthHeader();
  return authorization ? { Authorization: authorization } : {};
}

function jenkinsBaseUrl(): string {
  return (process.env.JENKINS_URL || "http://127.0.0.1:8080").replace(/\/$/, "");
}

export async function jenkinsReachable(): Promise<boolean> {
  try {
    await fetchJson<unknown>(`${jenkinsBaseUrl()}/api/json?tree=mode`, jenkinsHeaders());
    return true;
  } catch {
    return false;
  }
}

export async function latestJenkinsBuild(): Promise<{
  status: string;
  branch: string;
  build: string;
} | null> {
  const base = jenkinsBaseUrl();
  const headers = jenkinsHeaders();
  const configuredJob = process.env.JENKINS_JOB;

  try {
    let jobName = configuredJob;

    if (!jobName) {
      const root = await fetchJson<JenkinsRoot>(
        `${base}/api/json?tree=jobs[name,lastBuild[number,result,url]]`,
        headers
      );
      const jobs = root.jobs ?? [];
      const preferred =
        jobs.find((job) => /devops/i.test(job.name)) ??
        jobs.find((job) => job.lastBuild?.number != null) ??
        jobs[0];

      jobName = preferred?.name;
    }

    if (!jobName) return null;

    const build = await fetchJson<JenkinsBuild>(
      `${base}/job/${encodeURIComponent(jobName)}/lastBuild/api/json?tree=number,result,url,displayName,actions[lastBuiltRevision[branch[name]]]`,
      headers
    );

    const branch =
      build.actions
        ?.flatMap((action) => action.lastBuiltRevision?.branch ?? [])
        .map((item) => item.name)
        .find(Boolean) ?? "unavailable";

    return {
      status: build.result ? build.result.toUpperCase() : "IN PROGRESS",
      branch,
      build: build.number != null ? `#${build.number}` : "unavailable",
    };
  } catch {
    return null;
  }
}

export function publicError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message.replace(/Authorization:?\s*\S+/gi, "").trim();
  }
  return "Unavailable";
}
