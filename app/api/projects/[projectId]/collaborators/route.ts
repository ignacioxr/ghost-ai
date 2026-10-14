import { clerkClient } from "@clerk/nextjs/server";
import { Prisma } from "@/app/generated/prisma/client";

import { getCurrentIdentity, getProjectIfAccessible } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ projectId: string }> };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function authorize(projectId: string, { ownerOnly }: { ownerOnly: boolean }) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const project = await getProjectIfAccessible(identity, projectId);
  if (!project) {
    return { error: Response.json({ error: "Not found" }, { status: 404 }) };
  }

  const isOwner = project.ownerId === identity.userId;
  if (ownerOnly && !isOwner) {
    return { error: Response.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { error: null, isOwner, ownerId: project.ownerId };
}

async function getOwner(ownerId: string) {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(ownerId);
    const primary = user.emailAddresses.find(
      (e) => e.id === user.primaryEmailAddressId
    );
    return {
      email: primary?.emailAddress ?? null,
      name: [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
      imageUrl: user.imageUrl,
    };
  } catch {
    return { email: null, name: null, imageUrl: null };
  }
}

async function getAccessList(projectId: string, ownerId: string) {
  const [owner, collaborators] = await Promise.all([
    getOwner(ownerId),
    listCollaborators(projectId),
  ]);
  return { owner, collaborators };
}

async function listCollaborators(projectId: string) {
  const rows = await prisma.projectCollaborator.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    select: { email: true },
  });
  if (rows.length === 0) return [];

  // Enrich with Clerk profile data; fall back to email only when no user matches.
  const profiles = new Map<string, { name: string | null; imageUrl: string }>();
  try {
    const client = await clerkClient();
    const { data: users } = await client.users.getUserList({
      emailAddress: rows.map((r) => r.email),
      limit: 100,
    });
    for (const user of users) {
      const name =
        [user.firstName, user.lastName].filter(Boolean).join(" ") || null;
      for (const e of user.emailAddresses) {
        profiles.set(e.emailAddress.toLowerCase(), {
          name,
          imageUrl: user.imageUrl,
        });
      }
    }
  } catch {
    // Clerk unavailable: show emails only.
  }

  return rows.map(({ email }) => {
    const profile = profiles.get(email.toLowerCase());
    return {
      email,
      name: profile?.name ?? null,
      imageUrl: profile?.imageUrl ?? null,
    };
  });
}

export async function GET(_request: Request, { params }: Context) {
  const { projectId } = await params;
  const { error, isOwner, ownerId } = await authorize(projectId, {
    ownerOnly: false,
  });
  if (error) return error;

  return Response.json({ isOwner, ...(await getAccessList(projectId, ownerId)) });
}

export async function POST(request: Request, { params }: Context) {
  const { projectId } = await params;
  const { error, ownerId } = await authorize(projectId, { ownerOnly: true });
  if (error) return error;

  const body = await request.json().catch(() => null);
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_PATTERN.test(email)) {
    return Response.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  const identity = await getCurrentIdentity();
  if (identity?.email?.toLowerCase() === email) {
    return Response.json(
      { error: "You already own this project" },
      { status: 400 }
    );
  }

  try {
    await prisma.projectCollaborator.create({ data: { projectId, email } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return Response.json(
        { error: "Already a collaborator" },
        { status: 409 }
      );
    }

    throw error;
  }

  return Response.json(
    await getAccessList(projectId, ownerId),
    { status: 201 }
  );
}

export async function DELETE(request: Request, { params }: Context) {
  const { projectId } = await params;
  const { error, ownerId } = await authorize(projectId, { ownerOnly: true });
  if (error) return error;

  const body = await request.json().catch(() => null);
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) {
    return Response.json({ error: "Email is required" }, { status: 400 });
  }

  await prisma.projectCollaborator.deleteMany({ where: { projectId, email } });

  return Response.json(await getAccessList(projectId, ownerId));
}
