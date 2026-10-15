"use client";

import { createContext, useContext } from "react";

import type { SaveStatus } from "@/hooks/useCanvasAutosave";

export interface SaveState {
  status: SaveStatus;
  saveNow: () => void;
}

// The canvas publishes its autosave state; the navbar Save button reads it.
export const SaveStatusContext = createContext<{
  state: SaveState | null;
  setState: (state: SaveState | null) => void;
} | null>(null);

export function useSaveStatusContext() {
  return useContext(SaveStatusContext);
}
