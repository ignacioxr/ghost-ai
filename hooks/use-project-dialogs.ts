"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { buildRoomId, generateSuffix, type Project } from "@/lib/projects";

export type ProjectDialogState =
  | { type: "closed" }
  | { type: "create" }
  | { type: "rename"; project: Project }
  | { type: "delete"; project: Project };

interface UseProjectDialogsOptions {
  projects: Project[];
}

export function useProjectDialogs({
  projects: serverProjects,
}: UseProjectDialogsOptions) {
  const router = useRouter();
  // Local copy lets us update the sidebar without router.refresh(), which
  // would race with (and cancel) a router.push() issued in the same tick.
  const [projects, setProjects] = useState(serverProjects);
  const [prevServerProjects, setPrevServerProjects] = useState(serverProjects);
  if (serverProjects !== prevServerProjects) {
    setPrevServerProjects(serverProjects);
    setProjects(serverProjects);
  }
  const pathname = usePathname();
  const [dialog, setDialog] = useState<ProjectDialogState>({ type: "closed" });
  const [name, setName] = useState("");
  const [suffix, setSuffix] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const roomId = buildRoomId(name, suffix);

  const close = useCallback(() => {
    if (isLoading) return;
    setError(null);
    setDialog({ type: "closed" });
  }, [isLoading]);

  const openCreate = useCallback(() => {
    setError(null);
    setName("");
    setSuffix(generateSuffix());
    setDialog({ type: "create" });
  }, []);

  const openRename = useCallback((project: Project) => {
    setError(null);
    setName(project.name);
    setDialog({ type: "rename", project });
  }, []);

  const openDelete = useCallback((project: Project) => {
    setError(null);
    setDialog({ type: "delete", project });
  }, []);

  const submit = useCallback(async () => {
    if (isLoading || dialog.type === "closed") return;
    const trimmed = name.trim();
    if (dialog.type !== "delete" && !trimmed) return;

    const getServerErrorMessage = async (
      response: Response,
      fallback: string
    ) => {
      try {
        const payload = await response.json();
        if (typeof payload?.error === "string") {
          return payload.error;
        }
      } catch {
        // Ignore JSON parsing failures and fall back to the default message.
      }

      return fallback;
    };

    setError(null);
    setIsLoading(true);
    try {
      if (dialog.type === "create") {
        const response = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: roomId, name: trimmed }),
        });
        if (!response.ok) {
          throw new Error(
            await getServerErrorMessage(response, "Failed to create project")
          );
        }
        const project: { id: string; name: string } = await response.json();
        setProjects((prev) => [
          { id: project.id, name: project.name, isOwner: true },
          ...prev,
        ]);
        setDialog({ type: "closed" });
        router.push(`/editor/${project.id}`);
        return;
      }

      const { id } = dialog.project;
      if (dialog.type === "rename") {
        const response = await fetch(`/api/projects/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmed }),
        });
        if (!response.ok) {
          throw new Error(
            await getServerErrorMessage(response, "Failed to rename project")
          );
        }
        setDialog({ type: "closed" });
        router.refresh();
      } else {
        const response = await fetch(`/api/projects/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error(
            await getServerErrorMessage(response, "Failed to delete project")
          );
        }
        setProjects((prev) => prev.filter((p) => p.id !== id));
        setDialog({ type: "closed" });
        if (pathname === `/editor/${id}`) {
          router.push("/editor");
        } else {
          router.refresh();
        }
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong.";
      setError(message);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [dialog, isLoading, name, pathname, roomId, router]);

  return {
    projects,
    dialog,
    name,
    setName,
    roomId,
    error,
    isLoading,
    openCreate,
    openRename,
    openDelete,
    close,
    submit,
  };
}
