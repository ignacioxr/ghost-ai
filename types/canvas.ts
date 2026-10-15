import type { Edge, Node } from "@xyflow/react";

export type CanvasNodeShape =
  | "rectangle"
  | "diamond"
  | "circle"
  | "pill"
  | "cylinder"
  | "hexagon";

export type NodeColorPair = {
  name: string;
  color: string;
  textColor: string;
};

// Mirrors the palette in context/ui-context.md.
export const NODE_COLORS: NodeColorPair[] = [
  { name: "Neutral", color: "#1F1F1F", textColor: "#EDEDED" },
  { name: "Blue", color: "#10233D", textColor: "#52A8FF" },
  { name: "Purple", color: "#2E1938", textColor: "#BF7AF0" },
  { name: "Orange", color: "#331B00", textColor: "#FF990A" },
  { name: "Red", color: "#3C1618", textColor: "#FF6166" },
  { name: "Pink", color: "#3A1726", textColor: "#F75F8F" },
  { name: "Green", color: "#0F2E18", textColor: "#62C073" },
  { name: "Teal", color: "#062822", textColor: "#0AC7B4" },
];

export type CanvasNodeData = {
  label: string;
  color: string;
  textColor: string;
  shape: CanvasNodeShape;
};

export type CanvasNode = Node<CanvasNodeData, "canvasNode">;

export type CanvasEdge = Edge<{ label?: string }, "canvasEdge">;
