import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export const CD_CONTAINER = "devops-platform-cd";
export const COMPOSE_CONTAINER = "devops-platform-app";

const DOCKER_TIMEOUT_MS = 5_000;
const HTTP_TIMEOUT_MS = 3_000;
const LOG_TAIL = 200;

type DockerInspect = {
  Name?: string;
  Config?: { Image?: string };
  State?: {
    Status?: string;
    Running?: boolean;
    Health?: { Status?: string };
    StartedAt?: string;
  };
  NetworkSettings?: {
    Ports?: Record<string, Array<{ HostIp?: string; HostPort?: string }> | null>;
  };
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
