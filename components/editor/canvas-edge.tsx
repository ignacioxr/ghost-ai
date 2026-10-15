"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import type { CanvasEdge } from "@/types/canvas";

export function CanvasEdgeView({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  data,
  selected,
}: EdgeProps<CanvasEdge>) {
  const { updateEdgeData } = useReactFlow();
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data?.label ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  const label = data?.label ?? "";
  const active = hovered || selected || editing;

  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  useEffect(() => {
    if (editing) {
      setDraft(label);
      inputRef.current?.focus();
    }
  }, [editing, label]);

  const stopEditing = () => setEditing(false);
  const commitLabel = () => {
    if (draft !== label) {
      updateEdgeData(id, { label: draft });
    }
    setEditing(false);
  };

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        interactionWidth={24}
        style={{ ...style, opacity: active ? 1 : 0.55, transition: "opacity 150ms" }}
      />
      {/* Wider invisible hit area that also tracks hover and double-click. */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={24}
        className="react-flow__edge-interaction"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onDoubleClick={(event) => {
          event.stopPropagation();
          setEditing(true);
        }}
      />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan nowheel absolute"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: editing || label || selected ? "all" : "none",
          }}
          onPointerDown={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onDoubleClick={(event) => {
            event.stopPropagation();
            setEditing(true);
          }}
        >
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              size={Math.max(draft.length, 3)}
              placeholder="Label"
              onChange={(event) => setDraft(event.target.value)}
              onBlur={commitLabel}
              onKeyDown={(event) => {
                event.stopPropagation();
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitLabel();
                } else if (event.key === "Escape") {
                  setDraft(label);
                  stopEditing();
                }
              }}
              className="nodrag nopan rounded-full border border-white/40 bg-surface px-2.5 py-0.5 text-center text-xs text-copy-primary outline-none"
            />
          ) : label ? (
            <span
              className={cn(
                "block cursor-text rounded-full border bg-surface px-2.5 py-0.5 text-xs text-copy-primary transition-colors",
                active ? "border-white/40" : "border-surface-border",
              )}
            >
              {label}
            </span>
          ) : (
            selected && (
              <span className="block cursor-text select-none text-xs text-copy-muted opacity-60">
                Double-click to add label
              </span>
            )
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
