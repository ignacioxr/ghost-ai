"use client";

import { useCallback, useState } from "react";

import { MOCK_PROJECTS, type Project } from "@/lib/projects";

export type ProjectDialogState =
  | { type: "closed" }
  | { type: "create" }
  | { type: "rename"; project: Project }
  | { type: "delete"; project: Project };

const MOCK_LATENCY_MS = 400;

export function useProjectDialogs() {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [dialog, setDialog] = useState<ProjectDialogState>({ type: "closed" });
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const close = useCallback(() => {
    if (isLoading) return;
    setDialog({ type: "closed" });
  }, [isLoading]);

  const openCreate = useCallback(() => {
    setName("");
    setDialog({ type: "create" });
  }, []);

  const openRename = useCallback((project: Project) => {
    setName(project.name);
    setDialog({ type: "rename", project });
  }, []);

  const openDelete = useCallback((project: Project) => {
    setDialog({ type: "delete", project });
  }, []);

  const submit = useCallback(async () => {
    if (isLoading || dialog.type === "closed") return;
    const trimmed = name.trim();
    if (dialog.type !== "delete" && !trimmed) return;

    setIsLoading(true);
    try {
      // Mock latency only; real API calls arrive in a later feature.
      await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));

      if (dialog.type === "create") {
        setProjects((prev) => [
          ...prev,
          { id: crypto.randomUUID(), name: trimmed, isOwner: true },
        ]);
      } else if (dialog.type === "rename") {
        const { id } = dialog.project;
        setProjects((prev) =>
          prev.map((p) => (p.id === id ? { ...p, name: trimmed } : p))
        );
      } else {
        const { id } = dialog.project;
        setProjects((prev) => prev.filter((p) => p.id !== id));
      }
      setDialog({ type: "closed" });
    } finally {
      setIsLoading(false);
    }
  }, [dialog, isLoading, name]);

  return {
    projects,
    dialog,
    name,
    setName,
    isLoading,
    openCreate,
    openRename,
    openDelete,
    close,
    submit,
  };
}
