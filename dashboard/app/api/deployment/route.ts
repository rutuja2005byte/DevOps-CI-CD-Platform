import {
  imageTag,
  latestJenkinsBuild,
  publicError,
  resolveAppContainer,
} from "@/lib/infra";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let version = "unavailable";

    try {
      const { inspect } = await resolveAppContainer();
      version = imageTag(inspect.Config?.Image);
    } catch {
      version = "unavailable";
    }

    const jenkins = await latestJenkinsBuild();

    return Response.json({
      ok: Boolean(jenkins) || version !== "unavailable",
      status: jenkins?.status ?? "UNAVAILABLE",
      version,
      branch: jenkins?.branch ?? "unavailable",
      build: jenkins?.build ?? "unavailable",
      source: jenkins ? "jenkins" : "docker",
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        status: "UNAVAILABLE",
        version: "unavailable",
        branch: "unavailable",
        build: "unavailable",
        error: publicError(error),
      },
      { status: 503 }
    );
  }
}
