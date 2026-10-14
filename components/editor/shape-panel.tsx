"use client";

import { Circle, Cylinder, Diamond, Hexagon, RectangleHorizontal, Square } from "lucide-react";
import type { DragEvent } from "react";

import { SHAPE_DRAG_MIME, SHAPES, type ShapeDefinition } from "@/lib/canvas-shapes";

const ICONS: Record<ShapeDefinition["shape"], typeof Square> = {
  rectangle: Square,
  diamond: Diamond,
  circle: Circle,
  pill: RectangleHorizontal,
  cylinder: Cylinder,
  hexagon: Hexagon,
};

function onDragStart(event: DragEvent<HTMLDivElement>, def: ShapeDefinition) {
  const payload = { shape: def.shape, width: def.width, height: def.height };
  const json = JSON.stringify(payload);
  event.dataTransfer.setData(SHAPE_DRAG_MIME, json);
  event.dataTransfer.setData("text/plain", json);
  event.dataTransfer.effectAllowed = "move";
}

export function ShapePanel() {
  return (
    <div className="pointer-events-auto absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full border border-surface-border bg-surface px-2 py-1.5 shadow-lg">
      {SHAPES.map((def) => {
        const Icon = ICONS[def.shape];
        return (
          <div
            key={def.shape}
            role="button"
            draggable
            onDragStart={(e) => onDragStart(e, def)}
            title={def.label}
            aria-label={`Drag ${def.label} onto the canvas`}
            className="flex size-9 cursor-grab items-center justify-center rounded-full text-copy-secondary transition-colors hover:bg-elevated hover:text-copy-primary active:cursor-grabbing"
          >
            <Icon className="size-4" />
          </div>
        );
      })}
    </div>
  );
}
