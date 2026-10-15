import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { Liveblocks } from "@liveblocks/node";
import { mutateFlow } from "@liveblocks/react-flow/node";
import { logger, task } from "@trigger.dev/sdk";
import { generateText, Output } from "ai";
import { z } from "zod";

import { SHAPES } from "@/lib/canvas-shapes";
import {
  NODE_COLORS,
  type CanvasEdge,
  type CanvasNode,
  type CanvasNodeShape,
} from "@/types/canvas";
import { AI_STATUS_FEED_ID, type AiStatusPayload } from "@/types/tasks";

export interface DesignAgentPayload {
  prompt: string;
  roomId: string;
}

// Project uses GEMINI_API_KEY; the provider default is GOOGLE_GENERATIVE_AI_API_KEY.
const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const AI_USER_ID = "ghost-ai";
const AI_INFO = { name: "Ghost AI", avatar: "", color: "#6457f9" };
const PRESENCE_TTL = 30;
const OP_DELAY_MS = 350;
const EDGE_COLOR = "#f8fafc";
const MIN_WIDTH = 80;
const MIN_HEIGHT = 56;
const SIDES = ["top", "right", "bottom", "left"] as const;

const shapeNames = SHAPES.map((s) => s.shape) as [CanvasNodeShape, ...CanvasNodeShape[]];
const colorNames = NODE_COLORS.map((c) => c.name) as [string, ...string[]];

// Flat shape (nullable fields) keeps the structured-output schema simple for Gemini.
const operationSchema = z.object({
  action: z.enum([
    "add_node",
    "move_node",
    "resize_node",
    "update_node",
    "delete_node",
    "add_edge",
    "delete_edge",
  ]),
  id: z.string().nullable().describe("Node id (node actions) or edge id (delete_edge). Required for add_node: a new unique kebab-case id."),
  shape: z.enum(shapeNames).nullable().describe("add_node / update_node"),
  label: z.string().nullable().describe("add_node / update_node. Short, at most 4 words."),
  color: z.enum(colorNames).nullable().describe("add_node / update_node palette color name"),
  x: z.number().nullable().describe("add_node / move_node"),
  y: z.number().nullable().describe("add_node / move_node"),
  width: z.number().nullable().describe("add_node (optional) / resize_node"),
  height: z.number().nullable().describe("add_node (optional) / resize_node"),
  source: z.string().nullable().describe("add_edge source node id"),
  target: z.string().nullable().describe("add_edge target node id"),
  sourceHandle: z.enum(SIDES).nullable().describe("add_edge: side of the source node"),
  targetHandle: z.enum(SIDES).nullable().describe("add_edge: side of the target node"),
  edgeLabel: z.string().nullable().describe("add_edge optional label"),
});

const planSchema = z.object({
  summary: z.string().describe("One short sentence describing what was designed."),
  operations: z.array(operationSchema),
});

type Operation = z.infer<typeof operationSchema>;

const SYSTEM_PROMPT = `You are Ghost AI, a system-architecture design assistant that edits a collaborative canvas.
Respond with an ordered list of operations that turn the user's request into a diagram, taking the current canvas into account.

Rules:
- Allowed shapes: ${SHAPES.map((s) => `${s.shape} (default ${s.width}x${s.height})`).join(", ")}.
  Suggested use: rectangle = service, cylinder = database, pill = client/user/queue, hexagon = gateway/load balancer, diamond = decision, circle = external system/event.
- Allowed colors (by name): ${NODE_COLORS.map((c) => c.name).join(", ")}. Use colors consistently by role; Neutral is the default.
- Layout: left-to-right flow, grid-aligned to multiples of 10. Keep at least 80px of free space between nodes (about 250px column pitch, 190px row pitch). Never overlap existing nodes; place new nodes in free space (e.g. right of or below existing content).
- Add all nodes first, then edges. Edge handles are sides (top/right/bottom/left): use right -> left for left-to-right flow, bottom -> top for vertical flow.
- Edge source and target must be ids of existing nodes or nodes you add. Keep labels short.
- Only change or delete existing items when the request implies it. Reuse existing node ids when modifying.
- Node ids must be unique kebab-case strings.`;

function getClient() {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secret) throw new Error("LIVEBLOCKS_SECRET_KEY is not set");
  return new Liveblocks({ secret });
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const designAgent = task({
  id: "design-agent",
  retry: { maxAttempts: 1 },
  run: async (payload: DesignAgentPayload) => {
    const { prompt, roomId } = payload;
    const client = getClient();

    const setPresence = (cursor: { x: number; y: number } | null, thinking: boolean, ttl = PRESENCE_TTL) =>
      client
        .setPresence(roomId, { userId: AI_USER_ID, data: { cursor, thinking }, userInfo: AI_INFO, ttl })
        .catch((error) => logger.warn("Failed to set AI presence", { error: String(error) }));

    // Status updates go to the shared `ai-status-feed`; the sidebar shows the latest one.
    const status = async (_state: "start" | "processing" | "complete" | "error", text: string) => {
      const data: AiStatusPayload = { text };
      await client
        .createFeedMessage({ roomId, feedId: AI_STATUS_FEED_ID, data })
        .catch((error) => logger.warn("Failed to post AI status", { error: String(error) }));
    };

    await client
      .createFeed({ roomId, feedId: AI_STATUS_FEED_ID })
      .catch(() => {}); // already exists

    try {
      await status("start", "Ghost AI is reading your request…");
      await setPresence(null, true);

      let snapshot: { nodes: readonly CanvasNode[]; edges: readonly CanvasEdge[] } = { nodes: [], edges: [] };
      await mutateFlow<CanvasNode, CanvasEdge>({ client, roomId }, (flow) => {
        snapshot = flow.toJSON();
      });

      const canvas = {
        nodes: snapshot.nodes.map((n) => ({
          id: n.id,
          shape: n.data.shape,
          label: n.data.label,
          x: Math.round(n.position.x),
          y: Math.round(n.position.y),
          width: n.width ?? n.measured?.width,
          height: n.height ?? n.measured?.height,
        })),
        edges: snapshot.edges.map((e) => ({ id: e.id, source: e.source, target: e.target, label: e.data?.label })),
      };

      await status("processing", "Ghost AI is designing…");
      const { output: plan } = await generateText({
        model: google("gemini-3.8-flash"),
        system: SYSTEM_PROMPT,
        prompt: `Current canvas:\n${JSON.stringify(canvas)}\n\nUser request:\n${prompt}`,
        output: Output.object({ schema: planSchema }),
      });

      const total = plan.operations.length;
      await status("processing", `Applying ${total} change${total === 1 ? "" : "s"} to the canvas…`);

      let applied = 0;
      for (const op of plan.operations) {
        let cursor: { x: number; y: number } | null = null;
        try {
          await mutateFlow<CanvasNode, CanvasEdge>({ client, roomId }, (flow) => {
            cursor = applyOperation(flow, op);
          });
        } catch (error) {
          logger.warn("Failed to apply operation", { action: op.action, error: String(error) });
          continue;
        }
        if (cursor) {
          applied += 1;
          await setPresence(cursor, true);
          await sleep(OP_DELAY_MS);
        }
      }

      await status("complete", applied > 0 ? plan.summary || "Design complete." : "No changes were needed.");
      return { summary: plan.summary, operations: total, applied };
    } catch (error) {
      logger.error("Design agent failed", { error: String(error) });
      await status("error", "Ghost AI couldn't finish this design. Please try again.");
      throw error;
    } finally {
      // Short TTL so the AI cursor/thinking indicator disappears right away.
      await setPresence(null, false, 2);
    }
  },
});

type Flow = Parameters<Parameters<typeof mutateFlow<CanvasNode, CanvasEdge>>[1]>[0];

// Applies one validated operation; returns where the AI cursor should go, or null if skipped.
function applyOperation(flow: Flow, op: Operation): { x: number; y: number } | null {
  const palette = NODE_COLORS.find((c) => c.name === op.color);

  switch (op.action) {
    case "add_node": {
      if (!op.id || flow.getNode(op.id)) return null;
      const shape = op.shape ?? "rectangle";
      const size = SHAPES.find((s) => s.shape === shape) ?? SHAPES[0];
      const fallback = NODE_COLORS[0];
      const x = op.x ?? 0;
      const y = op.y ?? 0;
      const width = Math.max(MIN_WIDTH, op.width ?? size.width);
      const height = Math.max(MIN_HEIGHT, op.height ?? size.height);
      flow.addNode({
        id: op.id,
        type: "canvasNode",
        position: { x, y },
        width,
        height,
        data: {
          label: op.label ?? "",
          shape,
          color: (palette ?? fallback).color,
          textColor: (palette ?? fallback).textColor,
        },
      });
      return { x: x + width / 2, y: y + height / 2 };
    }
    case "move_node": {
      const node = op.id ? flow.getNode(op.id) : undefined;
      if (!node || op.x == null || op.y == null) return null;
      flow.updateNode(node.id, { position: { x: op.x, y: op.y } });
      return { x: op.x, y: op.y };
    }
    case "resize_node": {
      const node = op.id ? flow.getNode(op.id) : undefined;
      if (!node || op.width == null || op.height == null) return null;
      flow.updateNode(node.id, {
        width: Math.max(MIN_WIDTH, op.width),
        height: Math.max(MIN_HEIGHT, op.height),
      });
      return { x: node.position.x, y: node.position.y };
    }
    case "update_node": {
      const node = op.id ? flow.getNode(op.id) : undefined;
      if (!node) return null;
      const data: Partial<CanvasNode["data"]> = {};
      if (op.label != null) data.label = op.label;
      if (op.shape != null) data.shape = op.shape;
      if (palette) {
        data.color = palette.color;
        data.textColor = palette.textColor;
      }
      flow.updateNodeData(node.id, data);
      return { x: node.position.x, y: node.position.y };
    }
    case "delete_node": {
      const node = op.id ? flow.getNode(op.id) : undefined;
      if (!node) return null;
      // Remove connected edges too so none are left dangling.
      flow.removeEdges(flow.edges.filter((e) => e.source === node.id || e.target === node.id).map((e) => e.id));
      flow.removeNode(node.id);
      return { x: node.position.x, y: node.position.y };
    }
    case "add_edge": {
      const source = op.source ? flow.getNode(op.source) : undefined;
      const target = op.target ? flow.getNode(op.target) : undefined;
      if (!source || !target || source.id === target.id) return null;
      const id = `edge-${source.id}-${target.id}`;
      if (flow.getEdge(id)) return null;
      flow.addEdge({
        id,
        type: "canvasEdge",
        source: source.id,
        target: target.id,
        sourceHandle: op.sourceHandle ?? "right",
        targetHandle: op.targetHandle ?? "left",
        markerEnd: { type: "arrowclosed", color: EDGE_COLOR },
        style: { stroke: EDGE_COLOR, strokeWidth: 1.5, strokeLinecap: "round" },
        data: op.edgeLabel ? { label: op.edgeLabel } : {},
      });
      return { x: target.position.x, y: target.position.y };
    }
    case "delete_edge": {
      const edge = op.id ? flow.getEdge(op.id) : undefined;
      if (!edge) return null;
      flow.removeEdge(edge.id);
      const target = flow.getNode(edge.target);
      return target ? { x: target.position.x, y: target.position.y } : { x: 0, y: 0 };
    }
  }
}
