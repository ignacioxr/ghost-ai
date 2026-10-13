"use client";

import { createContext, useContext, type ReactNode } from "react";

import { useProjectDialogs } from "@/hooks/use-project-dialogs";
import type { Project } from "@/lib/projects";

type ProjectDialogsValue = ReturnType<typeof useProjectDialogs>;

const ProjectDialogsContext = createContext<ProjectDialogsValue | null>(null);

interface ProjectDialogsProviderProps {
  projects: Project[];
  children: ReactNode;
}

export function ProjectDialogsProvider({
  projects,
  children,
}: ProjectDialogsProviderProps) {
  const value = useProjectDialogs({ projects });
  return (
    <ProjectDialogsContext.Provider value={value}>
      {children}
    </ProjectDialogsContext.Provider>
  );
}

export function useProjectDialogsContext(): ProjectDialogsValue {
  const value = useContext(ProjectDialogsContext);
  if (!value) {
    throw new Error(
      "useProjectDialogsContext must be used within ProjectDialogsProvider"
    );
  }
  return value;
}
