import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ projectId: string }> };

async function authorizeOwner(projectId: string) {
  const { userId } = await auth();
  if (!userId) {
    return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });
  if (!project) {
    return { error: Response.json({ error: "Not found" }, { status: 404 }) };
  }
  if (project.ownerId !== userId) {
    return { error: Response.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { error: null };
}

export async function PATCH(request: Request, { params }: Context) {
  const { projectId } = await params;
  const { error } = await authorizeOwner(projectId);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: { name },
  });

  return Response.json(project);
}

export async function DELETE(_request: Request, { params }: Context) {
  const { projectId } = await params;
  const { error } = await authorizeOwner(projectId);
  if (error) return error;

  await prisma.project.delete({ where: { id: projectId } });

  return new Response(null, { status: 204 });
}
