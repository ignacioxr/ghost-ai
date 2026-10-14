import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AccessDenied } from "@/components/editor/access-denied";
import { LiveblocksCanvas } from "@/components/editor/liveblocks-canvas";
import {
  getCurrentIdentity,
  getProjectIfAccessible,
} from "@/lib/project-access";

async function Workspace({
  params,
}: {
  params: PageProps<"/editor/[roomId]">["params"];
}) {
  const { roomId } = await params;

  const identity = await getCurrentIdentity();
  if (!identity) redirect("/sign-in");

  const project = await getProjectIfAccessible(identity, roomId);
  if (!project) return <AccessDenied />;

  return <LiveblocksCanvas roomId={roomId} />;
}

export default function WorkspacePage({
  params,
}: PageProps<"/editor/[roomId]">) {
  return (
    <Suspense fallback={null}>
      <Workspace params={params} />
    </Suspense>
  );
}
