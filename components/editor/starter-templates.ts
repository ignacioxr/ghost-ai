import { MarkerType } from "@xyflow/react";

import { SHAPES } from "@/lib/canvas-shapes";
import {
  NODE_COLORS,
  type CanvasEdge,
  type CanvasNode,
  type CanvasNodeShape,
} from "@/types/canvas";

export type CanvasTemplate = {
  id: string;
  name: string;
  description: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
};

type ColorName = (typeof NODE_COLORS)[number]["name"];
type Side = "top" | "right" | "bottom" | "left";

const EDGE_COLOR = "#f8fafc";

function node(
  id: string,
  shape: CanvasNodeShape,
  label: string,
  x: number,
  y: number,
  colorName: ColorName = "Neutral",
): CanvasNode {
  const size = SHAPES.find((s) => s.shape === shape) ?? SHAPES[0];
  const palette = NODE_COLORS.find((c) => c.name === colorName) ?? NODE_COLORS[0];
  return {
    id,
    type: "canvasNode",
    position: { x, y },
    width: size.width,
    height: size.height,
    data: {
      label,
      shape,
      color: palette.color,
      textColor: palette.textColor,
    },
  };
}

function edge(
  source: string,
  target: string,
  sourceHandle: Side = "right",
  targetHandle: Side = "left",
  label?: string,
): CanvasEdge {
  return {
    id: `edge-${source}-${target}`,
    type: "canvasEdge",
    source,
    target,
    sourceHandle,
    targetHandle,
    markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_COLOR },
    style: { stroke: EDGE_COLOR, strokeWidth: 1.5, strokeLinecap: "round" },
    data: label ? { label } : {},
  };
}

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  {
    id: "microservices",
    name: "Microservices",
    description:
      "API gateway routing to independent services, each with its own datastore.",
    nodes: [
      node("client", "pill", "Client", 0, 190, "Neutral"),
      node("gateway", "hexagon", "API Gateway", 250, 175, "Blue"),
      node("auth", "rectangle", "Auth Service", 540, 0, "Purple"),
      node("orders", "rectangle", "Order Service", 540, 190, "Purple"),
      node("catalog", "rectangle", "Catalog Service", 540, 380, "Purple"),
      node("auth-db", "cylinder", "Users DB", 830, -20, "Green"),
      node("orders-db", "cylinder", "Orders DB", 830, 170, "Green"),
      node("catalog-db", "cylinder", "Catalog DB", 830, 360, "Green"),
    ],
    edges: [
      edge("client", "gateway"),
      edge("gateway", "auth"),
      edge("gateway", "orders"),
      edge("gateway", "catalog"),
      edge("auth", "auth-db"),
      edge("orders", "orders-db"),
      edge("catalog", "catalog-db"),
    ],
  },
  {
    id: "ci-cd-pipeline",
    name: "CI/CD Pipeline",
    description:
      "Commit to production flow with build, test, and a staging approval gate.",
    nodes: [
      node("commit", "pill", "Git Push", 0, 100, "Neutral"),
      node("build", "rectangle", "Build", 230, 90, "Blue"),
      node("test", "rectangle", "Test", 460, 90, "Blue"),
      node("passed", "diamond", "Tests Pass?", 690, 65, "Orange"),
      node("fail", "pill", "Notify Team", 690, 280, "Red"),
      node("staging", "rectangle", "Deploy Staging", 950, 90, "Purple"),
      node("prod", "circle", "Production", 1210, 80, "Green"),
    ],
    edges: [
      edge("commit", "build"),
      edge("build", "test"),
      edge("test", "passed"),
      edge("passed", "staging", "right", "left", "yes"),
      edge("passed", "fail", "bottom", "top", "no"),
      edge("staging", "prod"),
    ],
  },
  {
    id: "event-driven",
    name: "Event-Driven System",
    description:
      "Producers publish to a message broker consumed by independent workers.",
    nodes: [
      node("web", "pill", "Web App", 0, 0, "Neutral"),
      node("api", "rectangle", "Orders API", 0, 200, "Blue"),
      node("broker", "hexagon", "Event Broker", 280, 90, "Orange"),
      node("billing", "rectangle", "Billing Worker", 570, -40, "Purple"),
      node("email", "rectangle", "Email Worker", 570, 140, "Purple"),
      node("analytics", "rectangle", "Analytics Worker", 570, 320, "Purple"),
      node("store", "cylinder", "Event Store", 860, 300, "Green"),
    ],
    edges: [
      edge("web", "api", "bottom", "top"),
      edge("api", "broker", "right", "left", "publish"),
      edge("broker", "billing", "right", "left", "subscribe"),
      edge("broker", "email"),
      edge("broker", "analytics"),
      edge("analytics", "store"),
    ],
  },
];
