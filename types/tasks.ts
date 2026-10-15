import { z } from "zod";

// Shared Liveblocks feed that carries AI activity updates for a room.
export const AI_STATUS_FEED_ID = "ai-status-feed";

export const aiStatusPayloadSchema = z.object({
  text: z.string().optional(),
});

export type AiStatusPayload = z.infer<typeof aiStatusPayloadSchema>;

// Room-scoped Liveblocks feed for collaborative sidebar chat (separate from the status feed).
export const AI_CHAT_FEED_ID = "ai-chat";

export const aiChatMessageSchema = z.object({
  sender: z.object({ id: z.string(), name: z.string() }),
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
  timestamp: z.number(),
});

export type AiChatMessage = z.infer<typeof aiChatMessageSchema>;

// Input contract for the spec generation flow (API route and `generate-spec` task).
export const specChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

export const specNodeSchema = z
  .object({
    id: z.string(),
    data: z
      .object({ label: z.string().optional(), shape: z.string().optional() })
      .passthrough()
      .optional(),
  })
  .passthrough();

export const specEdgeSchema = z
  .object({
    id: z.string().optional(),
    source: z.string(),
    target: z.string(),
    data: z.object({ label: z.string().optional() }).passthrough().nullish(),
  })
  .passthrough();

export const specRequestSchema = z.object({
  roomId: z.string().min(1),
  chatHistory: z.array(specChatMessageSchema).default([]),
  nodes: z.array(specNodeSchema),
  edges: z.array(specEdgeSchema),
});

export type SpecRequest = z.infer<typeof specRequestSchema>;

export const generateSpecPayloadSchema = specRequestSchema.extend({
  projectId: z.string().min(1),
});

export type GenerateSpecPayload = z.infer<typeof generateSpecPayloadSchema>;
