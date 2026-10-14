import "server-only";

import { auth, clerkClient } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";

export interface CurrentIdentity {
  userId: string;
  email: string | null;
}

export async function getCurrentIdentity(): Promise<CurrentIdentity | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const primary = user.emailAddresses.find(
    (e) => e.id === user.primaryEmailAddressId
  );

  return { userId, email: primary?.emailAddress ?? null };
}

// Returns the project if the identity owns it or is a collaborator, else null.
export async function getProjectIfAccessible(
  identity: CurrentIdentity,
  projectId: string
) {
  const normalizedEmail = identity.email?.toLowerCase() ?? null;

  return prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { ownerId: identity.userId },
        ...(normalizedEmail
          ? [{ collaborators: { some: { email: normalizedEmail } } }]
          : []),
      ],
    },
    select: { id: true, name: true, ownerId: true },
  });
}
