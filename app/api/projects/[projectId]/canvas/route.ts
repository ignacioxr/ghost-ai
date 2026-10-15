import { get, put } from "@vercel/blob";

import { prisma } from "@/lib/prisma";
import { getCurrentIdentity, getProjectIfAccessible } from "@/lib/project-access";

type Context = { params: Promise<{ projectId: string }> };

async function authorize(projectId: string) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const project = await getProjectIfAccessible(identity, projectId);
  if (!project) {
    return { error: Response.json({ error: "Not found" }, { status: 404 }) };
  }
  return { error: null };
}

export async function GET(_request: Request, { params }: Context) {
  const { projectId } = await params;
  const { error } = await authorize(projectId);
  if (error) return error;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { canvasJsonPath: true },
  });
  if (!project?.canvasJsonPath) {
    return Response.json({ nodes: [], edges: [] });
  }

  try {
    const result = await get(project.canvasJsonPath, {
      access: "private",
      useCache: false,
    });
    if (!result || result.statusCode !== 200) {
      return Response.json(
        { error: "Failed to load canvas" },
        { status: 502 },
      );
    }

    const canvas = await new Response(result.stream).json().catch(() => null);
    return Response.json({
      nodes: Array.isArray(canvas?.nodes) ? canvas.nodes : [],
      edges: Array.isArray(canvas?.edges) ? canvas.edges : [],
    });
  } catch {
    return Response.json({ error: "Failed to load canvas" }, { status: 502 });
  }
}

export async function PUT(request: Request, { params }: Context) {
  const { projectId } = await params;
  const { error } = await authorize(projectId);
  if (error) return error;

  const body = await request.json().catch(() => null);
  if (!Array.isArray(body?.nodes) || !Array.isArray(body?.edges)) {
    return Response.json(
      { error: "nodes and edges arrays are required" },
      { status: 400 },
    );
  }

  let blob;
  try {
    blob = await put(
      `canvas/${projectId}.json`,
      JSON.stringify({ nodes: body.nodes, edges: body.edges }),
      {
        access: "private",
        contentType: "application/json",
        addRandomSuffix: false,
        allowOverwrite: true,
      },
    );
  } catch {
    return Response.json({ error: "Failed to save canvas" }, { status: 502 });
  }

  try {
    await prisma.project.update({
      where: { id: projectId },
      data: { canvasJsonPath: blob.url },
    });
  } catch {
    return Response.json({ error: "Failed to save canvas metadata" }, { status: 500 });
  }

  return Response.json({ url: blob.url });
}
