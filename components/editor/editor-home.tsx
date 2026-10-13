"use client";

import { Plus } from "lucide-react";

import { useProjectDialogsContext } from "@/components/editor/project-dialogs-provider";
import { Button } from "@/components/ui/button";

export function EditorHome() {
  const { openCreate } = useProjectDialogsContext();

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-copy-primary">
          Create a project or open an existing one
        </h1>
        <p className="text-sm text-copy-muted">
          Start a new architecture workspace, or choose a project from the
          sidebar.
        </p>
      </div>
      <Button onClick={openCreate}>
        <Plus className="h-4 w-4" />
        New Project
      </Button>
    </div>
  );
}
