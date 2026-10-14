import type { CanvasNodeShape } from "@/types/canvas";

export const SHAPE_DRAG_MIME = "application/x-ghost-shape";

export const DEFAULT_NODE_COLOR = "#2a2f3a";

export type ShapeDefinition = {
  shape: CanvasNodeShape;
  label: string;
  width: number;
  height: number;
};

export const SHAPES: ShapeDefinition[] = [
  { shape: "rectangle", label: "Rectangle", width: 160, height: 90 },
  { shape: "diamond", label: "Diamond", width: 140, height: 140 },
  { shape: "circle", label: "Circle", width: 110, height: 110 },
  { shape: "pill", label: "Pill", width: 160, height: 70 },
  { shape: "cylinder", label: "Cylinder", width: 110, height: 130 },
  { shape: "hexagon", label: "Hexagon", width: 150, height: 110 },
];

export type ShapeDragPayload = {
  shape: CanvasNodeShape;
  width: number;
  height: number;
};

export function parseShapeDragPayload(raw: string): ShapeDragPayload | null {
  try {
    const value = JSON.parse(raw) as Partial<ShapeDragPayload>;
    const known = SHAPES.some((s) => s.shape === value.shape);
    if (!known || typeof value.width !== "number" || typeof value.height !== "number") {
      return null;
    }
    return value as ShapeDragPayload;
  } catch {
    return null;
  }
}
