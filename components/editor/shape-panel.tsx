"use client";

import {
  Circle,
  Cylinder,
  Diamond,
  Hexagon,
  RectangleHorizontal,
  Square,
} from "lucide-react";
import { useEffect, useState, type DragEvent } from "react";
import { useViewport } from "@xyflow/react";

import { ShapeGraphic } from "@/components/editor/canvas-node";

import {
  DEFAULT_NODE_COLOR,
  SHAPE_DRAG_MIME,
  SHAPES,
  type ShapeDefinition,
} from "@/lib/canvas-shapes";

const ICONS: Record<ShapeDefinition["shape"], typeof Square> = {
  rectangle: Square,
  diamond: Diamond,
  circle: Circle,
  pill: RectangleHorizontal,
  cylinder: Cylinder,
  hexagon: Hexagon,
};

const EMPTY_IMAGE =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
let emptyDragImage: HTMLImageElement | null = null;

function getEmptyDragImage() {
  if (!emptyDragImage) {
    emptyDragImage = new Image();
    emptyDragImage.src = EMPTY_IMAGE;
  }
  return emptyDragImage;
}

function startDrag(event: DragEvent<HTMLDivElement>, def: ShapeDefinition) {
  const payload = { shape: def.shape, width: def.width, height: def.height };
  const json = JSON.stringify(payload);
  event.dataTransfer.setData(SHAPE_DRAG_MIME, json);
  event.dataTransfer.setData("text/plain", json);
  event.dataTransfer.effectAllowed = "move";
  // Hide the browser's default drag image; a ghost preview is rendered instead.
  event.dataTransfer.setDragImage(getEmptyDragImage(), 0, 0);
}

export function ShapePanel() {
  const { zoom } = useViewport();
  const [dragging, setDragging] = useState<ShapeDefinition | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!dragging) return;
    const onDragOver = (e: globalThis.DragEvent) =>
      setPointer({ x: e.clientX, y: e.clientY });
    const reset = () => {
      setDragging(null);
      setPointer(null);
    };
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("drop", reset);
    window.addEventListener("dragend", reset);
    return () => {
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("drop", reset);
      window.removeEventListener("dragend", reset);
    };
  }, [dragging]);

  return (
    <>
      <div className="pointer-events-auto absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full border border-surface-border bg-surface px-2 py-1.5 shadow-lg">
        {SHAPES.map((def) => {
          const Icon = ICONS[def.shape];
          return (
            <div
              key={def.shape}
              role="button"
              draggable
              onDragStart={(e) => {
                startDrag(e, def);
                setDragging(def);
              }}
              title={def.label}
              aria-label={`Drag ${def.label} onto the canvas`}
              className="flex size-9 cursor-grab items-center justify-center rounded-full text-copy-secondary transition-colors hover:bg-elevated hover:text-copy-primary active:cursor-grabbing"
            >
              <Icon className="size-4" />
            </div>
          );
        })}
      </div>
      {dragging && pointer && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-50 opacity-60"
          style={{
            left: pointer.x - (dragging.width * zoom) / 2,
            top: pointer.y - (dragging.height * zoom) / 2,
            width: dragging.width * zoom,
            height: dragging.height * zoom,
          }}
        >
          <ShapeGraphic shape={dragging.shape} color={DEFAULT_NODE_COLOR} />
        </div>
      )}
    </>
  );
}
