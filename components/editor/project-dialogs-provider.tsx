"use client";

import { createContext, useContext, type ReactNode } from "react";

import { useProjectDialogs } from "@/hooks/use-project-dialogs";

type ProjectDialogsValue = ReturnType<typeof useProjectDialogs>;

const ProjectDialogsContext = createContext<ProjectDialogsValue | null>(null);

export function ProjectDialogsProvider({ children }: { children: ReactNode }) {
  const value = useProjectDialogs();
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
