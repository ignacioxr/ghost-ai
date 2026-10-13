import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { getAccessibleProject } from "@/lib/project-data";

async function Workspace({ projectId }: { projectId: string }) {
  const { userId } = await auth();
  if (!userId) notFound();

  const project = await getAccessibleProject(userId, projectId);
  if (!project) notFound();

  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
      <h1 className="text-xl font-semibold text-copy-primary">
        {project.name}
      </h1>
      <p className="font-mono text-xs text-copy-muted">Room: {project.id}</p>
    </div>
  );
}

export default function WorkspacePage({
  params,
}: PageProps<"/editor/[projectId]">) {
  return (
    <Suspense fallback={null}>
      <WorkspaceLoader params={params} />
    </Suspense>
  );
}

async function WorkspaceLoader({
  params,
}: {
  params: PageProps<"/editor/[projectId]">["params"];
}) {
  const { projectId } = await params;
  return <Workspace projectId={projectId} />;
}
