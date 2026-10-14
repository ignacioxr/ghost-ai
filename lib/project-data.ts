import "server-only";

import { clerkClient } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import type { Project } from "@/lib/projects";

export interface UserProjects {
  owned: Project[];
  shared: Project[];
}

export async function getUserProjects(userId: string): Promise<UserProjects> {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const emails = user.emailAddresses
    .filter((e) => e.verification?.status === "verified")
    .map((e) => e.emailAddress);

  const [owned, shared] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    }),
    prisma.project.findMany({
      where: {
        ownerId: { not: userId },
        collaborators: { some: { email: { in: emails } } },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    }),
  ]);

  return {
    owned: owned.map((p) => ({ ...p, isOwner: true })),
    shared: shared.map((p) => ({ ...p, isOwner: false })),
  };
}
