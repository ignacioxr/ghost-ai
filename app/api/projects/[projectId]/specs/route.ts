import { prisma } from "@/lib/prisma";
import { getCurrentIdentity, getProjectIfAccessible } from "@/lib/project-access";

type Context = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { projectId } = await params;

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

  const specs = await prisma.projectSpec.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true },
  });

  // Same naming as the download route's Content-Disposition filename.
  const filename = `${project.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "spec"}-spec.md`;

  return Response.json({
    specs: specs.map((spec) => ({
      id: spec.id,
      filename,
      createdAt: spec.createdAt.toISOString(),
    })),
  });
}
