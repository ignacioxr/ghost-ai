"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { CanvasEdge, CanvasNode } from "@/types/canvas";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

const DEBOUNCE_MS = 2000;

// React Flow rewrites view-only fields (selection, drag, measured size) on focus
// and reconnect; they must not count as canvas changes.
function serializeCanvas(nodes: CanvasNode[], edges: CanvasEdge[]) {
  return JSON.stringify({
    nodes: nodes.map((node) => ({
      ...node,
      measured: undefined,
      dragging: undefined,
      selected: undefined,
    })),
    edges: edges.map((edge) => ({ ...edge, selected: undefined })),
  });
}

interface UseCanvasAutosaveOptions {
  projectId: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  // Autosave stays off until the initial load check has finished, so an empty
  // room can never overwrite a saved canvas.
  enabled: boolean;
}

export function useCanvasAutosave({
  projectId,
  nodes,
  edges,
  enabled,
}: UseCanvasAutosaveOptions) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const lastSaved = useRef<string | null>(null);
  const latest = useRef({ nodes, edges });
  const inFlight = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    latest.current = { nodes, edges };
  });

  const save = useCallback(
    async ({ keepalive = false }: { keepalive?: boolean } = {}) => {
      const persist = async () => {
        const snapshot = serializeCanvas(
          latest.current.nodes,
          latest.current.edges,
        );
        if (snapshot === lastSaved.current) {
          setStatus((current) => (current === "idle" ? current : "saved"));
          return;
        }

        setStatus("saving");

        try {
          const res = await fetch(`/api/projects/${projectId}/canvas`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: snapshot,
            ...(keepalive ? { keepalive: true } : {}),
          });
          if (!res.ok) throw new Error(`Save failed (${res.status})`);
          lastSaved.current = snapshot;
          setStatus("saved");
        } catch {
          setStatus("error");
          return;
        }

        const latestSnapshot = serializeCanvas(
          latest.current.nodes,
          latest.current.edges,
        );
        if (latestSnapshot !== lastSaved.current) {
          await persist();
        }
      };

      const queued = inFlight.current.then(persist, persist);
      inFlight.current = queued.then(() => undefined, () => undefined);
      await queued;
    },
    [projectId],
  );

  // Baseline is whatever the canvas holds when autosave is enabled.
  useEffect(() => {
    if (enabled)
      lastSaved.current = serializeCanvas(
        latest.current.nodes,
        latest.current.edges,
      );
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const flush = () => {
      const snapshot = serializeCanvas(latest.current.nodes, latest.current.edges);
      if (snapshot !== lastSaved.current) {
        void save({ keepalive: true });
      }
    };

    const timer = setTimeout(() => {
      void save();
    }, DEBOUNCE_MS);

    window.addEventListener("pagehide", flush);

    return () => {
      clearTimeout(timer);
      flush();
      window.removeEventListener("pagehide", flush);
    };
  }, [enabled, nodes, edges, save]);

  return { status, saveNow: save };
}
