"use client";

import { createContext, useContext } from "react";

type StarterTemplatesContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

export const StarterTemplatesContext =
  createContext<StarterTemplatesContextValue | null>(null);

export function useStarterTemplates() {
  return useContext(StarterTemplatesContext);
}
