import { auth } from "@trigger.dev/sdk";
import { auth as clerkAuth } from "@clerk/nextjs/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const bodySchema = z.object({ runId: z.string().min(1) });

export async function POST(request: Request) {
  const { userId } = await clerkAuth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "runId is required" }, { status: 400 });
  }
  const { runId } = parsed.data;

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
      expirationTime: "1h",
    });
    return Response.json({ token });
  } catch {
    return Response.json({ error: "Failed to create token" }, { status: 502 });
  }
}
