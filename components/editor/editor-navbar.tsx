"use client";

import { UserButton } from "@clerk/nextjs";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Share2,
  Sparkles,
} from "lucide-react";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";

const subscribe = () => () => {};

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  projectName?: string;
  isAiSidebarOpen?: boolean;
  onToggleAiSidebar?: () => void;
  onShare?: () => void;
}

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
  projectName,
  isAiSidebarOpen = false,
  onToggleAiSidebar,
  onShare,
}: EditorNavbarProps) {
  // Clerk mounts its UserButton client-side only; defer it to avoid a hydration mismatch.
  const isClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
  const ToggleIcon = isSidebarOpen ? PanelLeftClose : PanelLeftOpen;
  const label = isSidebarOpen ? "Close sidebar" : "Open sidebar";

  return (
    <header className="relative z-40 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-surface-border bg-base px-4">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          aria-label={label}
          aria-expanded={isSidebarOpen}
          className="text-copy-muted hover:bg-subtle hover:text-copy-primary"
        >
          <ToggleIcon className="h-5 w-5" />
        </Button>
        {projectName && (
          <div className="min-w-0 leading-tight">
            <h1 className="truncate text-sm font-semibold text-copy-primary">
              {projectName}
            </h1>
            <p className="text-xs text-copy-muted">Workspace</p>
          </div>
        )}
      </div>
      <div className="flex items-center justify-end gap-2">
        {projectName && (
          <>
            <Button variant="outline" size="sm" onClick={onShare}>
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button
              size="sm"
              onClick={onToggleAiSidebar}
              aria-label={
                isAiSidebarOpen ? "Close AI sidebar" : "Open AI sidebar"
              }
              aria-pressed={isAiSidebarOpen}
              className={
                isAiSidebarOpen
                  ? ""
                  : "bg-accent-dim text-brand hover:bg-accent-dim/70"
              }
            >
              <Sparkles className="h-4 w-4" />
              AI
            </Button>
          </>
        )}
        {isClient && <UserButton />}
      </div>
    </header>
  );
}
