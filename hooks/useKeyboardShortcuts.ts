"use client";

import type { ReactFlowInstance } from "@xyflow/react";
import { useEffect } from "react";

export const ZOOM_DURATION = 200;

type UseKeyboardShortcutsOptions = {
  reactFlow: Pick<ReactFlowInstance, "zoomIn" | "zoomOut">;
  undo: () => void;
  redo: () => void;
};

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

export function useKeyboardShortcuts({
  reactFlow,
  undo,
  redo,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) return;

      const mod = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      if (mod) {
        if (key === "z") {
          event.preventDefault();
          if (event.shiftKey) redo();
          else undo();
        } else if (key === "y" && !event.shiftKey) {
          event.preventDefault();
          redo();
        }
        return;
      }

      if (event.altKey) return;

      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        reactFlow.zoomIn({ duration: ZOOM_DURATION });
      } else if (event.key === "-") {
        event.preventDefault();
        reactFlow.zoomOut({ duration: ZOOM_DURATION });
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [reactFlow, undo, redo]);
}
