import { get } from "@vercel/blob";

import { prisma } from "@/lib/prisma";
import { getCurrentIdentity, getProjectIfAccessible } from "@/lib/project-access";

type Context = { params: Promise<{ projectId: string; specId: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { projectId, specId } = await params;

  const identity = await getCurrentIdentity();
  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await getProjectIfAccessible(identity, projectId);
  if (!project) {
    const exists = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    return exists
      ? Response.json({ error: "Forbidden" }, { status: 403 })
      : Response.json({ error: "Not found" }, { status: 404 });
  }

  // Scoping by projectId ensures the spec belongs to this project.
  const spec = await prisma.projectSpec.findFirst({
    where: { id: specId, projectId },
    select: { id: true, filePath: true },
  });
  if (!spec) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const result = await get(spec.filePath, {
      access: "private",
      useCache: false,
    });
    if (!result || result.statusCode !== 200) {
      return Response.json({ error: "Spec file not found" }, { status: 404 });
    }

    const filename = `${project.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "spec"}-spec.md`;

    return new Response(result.stream, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return Response.json({ error: "Failed to load spec" }, { status: 502 });
  }
}
