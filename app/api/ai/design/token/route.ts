import { auth } from "@trigger.dev/sdk";
import { auth as clerkAuth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { userId } = await clerkAuth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const runId = typeof body?.runId === "string" ? body.runId : "";
  if (!runId) {
    return Response.json({ error: "runId is required" }, { status: 400 });
  }

  const taskRun = await prisma.taskRun.findUnique({
    where: { runId },
    select: { userId: true },
  });
  if (!taskRun || taskRun.userId !== userId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const token = await auth.createPublicToken({
      scopes: { read: { runs: [runId] } },
    });
    return Response.json({ token });
  } catch {
    return Response.json({ error: "Failed to create token" }, { status: 502 });
  }
}
