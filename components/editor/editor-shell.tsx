"use client";

import { Bot, Sparkles } from "lucide-react";
import { useParams } from "next/navigation";
import { useState, type ReactNode } from "react";

import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectDialogs } from "@/components/editor/project-dialogs";
import { ProjectDialogsProvider } from "@/components/editor/project-dialogs-provider";
import { ShareDialog } from "@/components/editor/share-dialog";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import type { Project } from "@/lib/projects";

interface EditorShellProps {
  projects: Project[];
  children: ReactNode;
}

export function EditorShell({ projects, children }: EditorShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(true);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const { roomId } = useParams<{ roomId?: string }>();
  const activeProject = projects.find((p) => p.id === roomId);

  return (
    <ProjectDialogsProvider projects={projects}>
      <div className="flex h-screen flex-col bg-base text-copy-primary">
        <EditorNavbar
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
          projectName={activeProject?.name}
          isAiSidebarOpen={isAiSidebarOpen}
          onToggleAiSidebar={() => setIsAiSidebarOpen((open) => !open)}
          onShare={() => setIsShareOpen(true)}
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
          <main className="absolute inset-0 overflow-hidden bg-base">{children}</main>
          {activeProject && isAiSidebarOpen && (
            <aside
              aria-label="AI assistant"
              className="absolute top-3 right-3 bottom-3 z-30 hidden w-96 flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface/95 shadow-2xl shadow-black/40 backdrop-blur lg:flex"
            >
              <div className="flex shrink-0 items-start justify-between border-b border-surface-border px-5 py-4">
                <div className="leading-tight">
                  <h2 className="text-sm font-semibold text-copy-primary">
                    AI Copilot
                  </h2>
                  <p className="text-xs text-copy-muted">Placeholder panel</p>
                </div>
                <Sparkles className="h-4 w-4 text-ai-text" />
              </div>
              <div className="flex min-h-0 flex-1 flex-col justify-between gap-4 p-4">
                <div className="flex gap-3 rounded-2xl border border-surface-border bg-elevated p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ai/20 text-ai-text">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-copy-primary">
                      Chat surface pending
                    </p>
                    <p className="text-xs text-copy-muted">
                      The toggle is wired. Messaging and generation are
                      intentionally out of scope here.
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border border-dashed border-surface-border p-4">
                  <p className="text-[11px] font-medium tracking-[0.18em] text-copy-faint uppercase">
                    Future hooks
                  </p>
                  <p className="mt-2 text-sm text-copy-secondary">
                    Prompt composer, run status, and architecture guidance will
                    attach to this sidebar.
                  </p>
                </div>
              </div>
            </aside>
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
    </ProjectDialogsProvider>
  );
}
