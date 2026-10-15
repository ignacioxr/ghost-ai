"use client";

import { useEffect, useState } from "react";

import type { SaveStatus } from "@/hooks/useCanvasAutosave";
import { cn } from "@/lib/utils";

const SAVED_VISIBLE_MS = 2000;

const LABELS: Record<Exclude<SaveStatus, "idle">, string> = {
  saving: "Saving…",
  saved: "Saved",
  error: "Save failed",
};

function Label({ status }: { status: Exclude<SaveStatus, "idle"> }) {
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (status !== "saved") return;
    const timer = setTimeout(() => setExpired(true), SAVED_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [status]);

  if (expired) return null;

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-none absolute bottom-[4.5rem] left-1/2 z-10 -translate-x-1/2 rounded-full border border-surface-border bg-surface px-3 py-0.5 text-xs font-medium shadow-lg",
        status === "error" ? "text-destructive" : "text-copy-muted",
      )}
    >
      {LABELS[status]}
    </div>
  );
}

// Floating label above the shape panel; disappears shortly after a save completes.
export function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;
  return <Label key={status} status={status} />;
}
