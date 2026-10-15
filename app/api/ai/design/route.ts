import { auth, tasks } from "@trigger.dev/sdk";

import type { designAgent } from "@/trigger/design-agent";
import { prisma } from "@/lib/prisma";
import { getCurrentIdentity, getProjectIfAccessible } from "@/lib/project-access";

export async function POST(request: Request) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
  const roomId = typeof body?.roomId === "string" ? body.roomId : "";
  if (!prompt || !roomId) {
    return Response.json(
      { error: "prompt and roomId are required" },
      { status: 400 },
    );
  }

  // The Liveblocks room ID is the project ID.
  const projectId = roomId;
  const project = await getProjectIfAccessible(identity, projectId);
  if (!project) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  let runId: string;
  try {
    const handle = await tasks.trigger<typeof designAgent>("design-agent", {
      prompt,
      roomId,
    });
    runId = handle.id;
  } catch {
    return Response.json({ error: "Failed to start design run" }, { status: 502 });
  }

  try {
    await prisma.taskRun.create({
      data: { runId, projectId, userId: identity.userId },
    });
  } catch {
    return Response.json({ error: "Failed to record design run" }, { status: 500 });
  }

  try {
    const publicToken = await auth.createPublicToken({
      scopes: { read: { runs: [runId] } },
    });
    return Response.json({ runId, publicToken });
  } catch {
    return Response.json({ error: "Failed to create run token" }, { status: 502 });
  }
}
