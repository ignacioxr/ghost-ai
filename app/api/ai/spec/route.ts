import { tasks } from "@trigger.dev/sdk";

import type { generateSpec } from "@/trigger/generate-spec";
import { prisma } from "@/lib/prisma";
import { getCurrentIdentity, getProjectIfAccessible } from "@/lib/project-access";
import { specRequestSchema } from "@/types/tasks";

export async function POST(request: Request) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = specRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const { roomId, chatHistory, nodes, edges } = parsed.data;

  // The Liveblocks room ID is the project ID; access is resolved from it, never from client input.
  const project = await getProjectIfAccessible(identity, roomId);
  if (!project) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  let runId: string;
  try {
    const handle = await tasks.trigger<typeof generateSpec>("generate-spec", {
      projectId: project.id,
      roomId,
      chatHistory,
      nodes,
      edges,
    });
    runId = handle.id;
  } catch {
    return Response.json({ error: "Failed to start spec run" }, { status: 502 });
  }

  try {
    await prisma.taskRun.create({
      data: { runId, projectId: project.id, userId: identity.userId },
    });
  } catch {
    return Response.json({ error: "Failed to record spec run" }, { status: 500 });
  }

  return Response.json({ runId });
}
