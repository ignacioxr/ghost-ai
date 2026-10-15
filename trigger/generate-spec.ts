import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { logger, metadata, task } from "@trigger.dev/sdk";
import { put } from "@vercel/blob";
import { generateText } from "ai";
import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/prisma";
import { generateSpecPayloadSchema, type GenerateSpecPayload } from "@/types/tasks";

// Project uses GEMINI_API_KEY; the provider default is GOOGLE_GENERATIVE_AI_API_KEY.
const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const SYSTEM_PROMPT = `You are Ghost AI, a senior software architect writing a technical specification from a system-architecture canvas.
Return plain Markdown only (no code fences around the whole document, no preamble).

Structure:
# <System name>
## Overview
## Components (each node: purpose, responsibilities, suggested technology)
## Data Flow (each connection: source -> target, what flows and why)
## Data Storage
## APIs and Interfaces
## Scalability and Reliability
## Security Considerations
## Open Questions

Base the spec on the canvas nodes and edges and on the chat history for intent. Do not invent components that are not implied by the canvas or chat; call out gaps under Open Questions. Be concrete and concise.`;

export const generateSpec = task({
  id: "generate-spec",
  run: async (rawPayload: GenerateSpecPayload) => {
    const payload = generateSpecPayloadSchema.parse(rawPayload);
    const { projectId, roomId, chatHistory, nodes, edges } = payload;

    metadata.set("status", "start");
    logger.info("Generating spec", { projectId, roomId, nodes: nodes.length, edges: edges.length });

    try {
      const labels = new Map(nodes.map((n) => [n.id, n.data?.label || n.id]));
      const canvas = {
        nodes: nodes.map((n) => ({
          id: n.id,
          label: n.data?.label ?? "",
          shape: n.data?.shape,
        })),
        edges: edges.map((e) => ({
          from: labels.get(e.source) ?? e.source,
          to: labels.get(e.target) ?? e.target,
          label: e.data?.label,
        })),
      };
      const history = chatHistory.map((m) => `${m.role}: ${m.content}`).join("\n");

      metadata.set("status", "processing");
      const { text } = await generateText({
        model: google("gemini-3.8-flash"),
        system: SYSTEM_PROMPT,
        prompt: `Canvas:\n${JSON.stringify(canvas)}\n\nChat history:\n${history || "(none)"}\n\nWrite the technical specification.`,
      });

      // Markdown lives in Blob; Prisma keeps only the metadata record.
      const specId = randomUUID();
      const blob = await put(`specs/${projectId}/${specId}.md`, text, {
        access: "private",
        contentType: "text/markdown; charset=utf-8",
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      await prisma.projectSpec.create({
        data: { id: specId, projectId, filePath: blob.url },
      });

      metadata.set("status", "complete");
      return { content: text, specId };
    } catch (error) {
      metadata.set("status", "error");
      logger.error("Spec generation failed", { error: String(error) });
      throw error;
    }
  },
});
