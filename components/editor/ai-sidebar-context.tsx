"use client";

import { createContext, useContext } from "react";

type AiSidebarContextValue = {
  isOpen: boolean;
  onClose: () => void;
};

// The shell owns open state; the canvas renders the sidebar inside the Liveblocks room.
export const AiSidebarContext = createContext<AiSidebarContextValue | null>(null);

export function useAiSidebar() {
  return useContext(AiSidebarContext);
}
