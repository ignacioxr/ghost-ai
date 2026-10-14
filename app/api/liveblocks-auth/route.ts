import { auth, currentUser } from "@clerk/nextjs/server";

import { getCursorColor } from "@/lib/cursor-color";
import { getLiveblocks } from "@/lib/liveblocks";
import { getCurrentIdentity, getProjectIfAccessible } from "@/lib/project-access";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const roomId = typeof body?.room === "string" ? body.room : "";
  if (!roomId) {
    return Response.json({ error: "Room is required" }, { status: 400 });
  }

  const identity = await getCurrentIdentity();
  const project = identity
    ? await getProjectIfAccessible(identity, roomId)
    : null;
  if (!project) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const liveblocks = getLiveblocks();

  // Create the room only if it does not already exist.
  try {
    await liveblocks.getRoom(roomId);
  } catch {
    await liveblocks.createRoom(roomId, { defaultAccesses: [] });
  }

  const user = await currentUser();
  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.username ||
    identity?.email ||
    "Anonymous";

  const session = liveblocks.prepareSession(userId, {
    userInfo: {
      name,
      avatar: user?.imageUrl ?? "",
      color: getCursorColor(userId),
    },
  });
  session.allow(roomId, session.FULL_ACCESS);

  const { status, body: token } = await session.authorize();
  return new Response(token, {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
