"use client";

import { useState, type ReactNode } from "react";

import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectDialogs } from "@/components/editor/project-dialogs";
import { ProjectDialogsProvider } from "@/components/editor/project-dialogs-provider";
import { ProjectSidebar } from "@/components/editor/project-sidebar";

interface EditorShellProps {
  children: ReactNode;
}

export function EditorShell({ children }: EditorShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <ProjectDialogsProvider>
      <div className="flex h-screen flex-col bg-base text-copy-primary">
        <EditorNavbar
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
        />
        <div className="relative min-h-0 flex-1 overflow-hidden">
          {isSidebarOpen && (
            <div
              aria-hidden
              onClick={() => setIsSidebarOpen(false)}
              className="absolute inset-0 z-20 bg-black/50 md:hidden"
            />
          )}
          <ProjectSidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
          <main className="h-full w-full">{children}</main>
        </div>
      </div>
      <ProjectDialogs />
    </ProjectDialogsProvider>
  );
}
