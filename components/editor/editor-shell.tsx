"use client";

import { useParams } from "next/navigation";
import { useState, type ReactNode } from "react";

import { AiSidebar } from "@/components/editor/ai-sidebar";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectDialogs } from "@/components/editor/project-dialogs";
import {
  ProjectDialogsProvider,
  useProjectDialogsContext,
} from "@/components/editor/project-dialogs-provider";
import {
  SaveStatusContext,
  type SaveState,
} from "@/components/editor/save-status-context";
import { ShareDialog } from "@/components/editor/share-dialog";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { StarterTemplatesContext } from "@/components/editor/starter-templates-context";
import type { Project } from "@/lib/projects";

interface EditorShellProps {
  projects: Project[];
  children: ReactNode;
}

export function EditorShell({ projects, children }: EditorShellProps) {
  return (
    <ProjectDialogsProvider projects={projects}>
      <EditorShellContent>{children}</EditorShellContent>
    </ProjectDialogsProvider>
  );
}

function EditorShellContent({ children }: { children: ReactNode }) {
  // Context list includes projects created this session, before the server prop refreshes.
  const { projects } = useProjectDialogsContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(true);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [saveState, setSaveState] = useState<SaveState | null>(null);
  const { roomId } = useParams<{ roomId?: string }>();
  const activeProject = projects.find((p) => p.id === roomId);

  return (
    <>
      <div className="flex h-screen flex-col bg-base text-copy-primary">
        <EditorNavbar
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
          projectName={activeProject?.name}
          isAiSidebarOpen={isAiSidebarOpen}
          onToggleAiSidebar={() => setIsAiSidebarOpen((open) => !open)}
          onShare={() => setIsShareOpen(true)}
          onOpenTemplates={() => setIsTemplatesOpen(true)}
          saveStatus={saveState?.status}
          onSave={saveState?.saveNow}
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
          <main className="absolute inset-0 overflow-hidden bg-base">
            <StarterTemplatesContext.Provider
              value={{ open: isTemplatesOpen, setOpen: setIsTemplatesOpen }}
            >
              <SaveStatusContext.Provider
                value={{ state: saveState, setState: setSaveState }}
              >
                {children}
              </SaveStatusContext.Provider>
            </StarterTemplatesContext.Provider>
          </main>
          {activeProject && (
            <AiSidebar
              isOpen={isAiSidebarOpen}
              onClose={() => setIsAiSidebarOpen(false)}
            />
          )}
        </div>
      </div>
      <ProjectDialogs />
      {activeProject && (
        <ShareDialog
          open={isShareOpen}
          onOpenChange={setIsShareOpen}
          projectId={activeProject.id}
          isOwner={activeProject.isOwner}
        />
      )}
    </>
  );
}
