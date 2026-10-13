"use client";

import { UserButton } from "@clerk/nextjs";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";

const subscribe = () => () => {};

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
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
    <header className="relative z-40 grid h-14 shrink-0 grid-cols-3 items-center border-b border-surface-border bg-surface px-3">
      <div className="flex items-center justify-start">
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
      </div>
      <div className="flex items-center justify-center" />
      <div className="flex items-center justify-end">
        {isClient && <UserButton />}
      </div>
    </header>
  );
}
