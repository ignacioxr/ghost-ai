import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const DEFAULT_NAME = "Untitled Project";
const ROOM_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,99}$/;

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(projects);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const rawName = typeof body?.name === "string" ? body.name.trim() : "";

  // Optional client-supplied ID keeps the project and its Liveblocks room aligned.
  const rawId = typeof body?.id === "string" ? body.id : undefined;
  if (rawId !== undefined && !ROOM_ID_PATTERN.test(rawId)) {
    return Response.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const project = await prisma.project.create({
      data: { id: rawId, ownerId: userId, name: rawName || DEFAULT_NAME },
    });
    return Response.json(project, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return Response.json({ error: "Project id already exists" }, { status: 409 });
    }
    throw error;
  }
}
