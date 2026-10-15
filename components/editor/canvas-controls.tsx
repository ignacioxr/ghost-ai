"use client";

import { useCanRedo, useCanUndo } from "@liveblocks/react/suspense";
import { Maximize, Redo2, Undo2, ZoomIn, ZoomOut } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { ZOOM_DURATION } from "@/hooks/useKeyboardShortcuts";
import { useReactFlow } from "@xyflow/react";

type ControlButtonProps = {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
};

function ControlButton({
  label,
  icon: Icon,
  onClick,
  disabled,
}: ControlButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-8 items-center justify-center rounded-full text-copy-secondary transition-colors hover:bg-elevated hover:text-copy-primary disabled:pointer-events-none disabled:opacity-35"
    >
      <Icon className="size-4" />
    </button>
  );
}

type CanvasControlsProps = {
  undo: () => void;
  redo: () => void;
};

export function CanvasControls({ undo, redo }: CanvasControlsProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  return (
    <div className="pointer-events-auto absolute bottom-4 left-4 z-20 flex items-center gap-1 rounded-full border border-surface-border bg-surface px-2 py-1.5 shadow-lg">
      <ControlButton
        label="Zoom out"
        icon={ZoomOut}
        onClick={() => zoomOut({ duration: ZOOM_DURATION })}
      />
      <ControlButton
        label="Fit view"
        icon={Maximize}
        onClick={() => fitView({ duration: ZOOM_DURATION })}
      />
      <ControlButton
        label="Zoom in"
        icon={ZoomIn}
        onClick={() => zoomIn({ duration: ZOOM_DURATION })}
      />
      <div className="mx-1 h-5 w-px bg-surface-border" />
      <ControlButton
        label="Undo"
        icon={Undo2}
        onClick={undo}
        disabled={!canUndo}
      />
      <ControlButton
        label="Redo"
        icon={Redo2}
        onClick={redo}
        disabled={!canRedo}
      />
    </div>
  );
}
