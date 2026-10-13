import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { EditorShell } from "@/components/editor/editor-shell";
import { getUserProjects } from "@/lib/project-data";

async function EditorShellWithProjects({ children }: { children: ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { owned, shared } = await getUserProjects(userId);

  return <EditorShell projects={[...owned, ...shared]}>{children}</EditorShell>;
}

export default function EditorLayout({ children }: LayoutProps<"/editor">) {
  return (
    <Suspense fallback={<div className="h-screen bg-base" />}>
      <EditorShellWithProjects>{children}</EditorShellWithProjects>
    </Suspense>
  );
}
