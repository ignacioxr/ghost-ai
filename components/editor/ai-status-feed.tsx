"use client";

import { useEffect } from "react";
import {
  useCreateFeed,
  useFeedMessages,
  useOthers,
  useSelf,
} from "@liveblocks/react/suspense";

import { AI_STATUS_FEED_ID, aiStatusPayloadSchema } from "@/types/tasks";

// True while anyone in the room (the AI agent included) has `thinking` set in presence.
export function useAiThinking() {
  const selfThinking = useSelf((me) => me.presence.thinking);
  const othersThinking = useOthers((others) =>
    others.some((other) => other.presence.thinking),
  );
  return Boolean(selfThinking) || othersThinking;
}

// Shows only the most recent validated message of the shared `ai-status-feed`.
export function AiStatusFeed({ active = false }: { active?: boolean }) {
  const createFeed = useCreateFeed();
  const { messages } = useFeedMessages(AI_STATUS_FEED_ID);
  const isThinking = useAiThinking();

  // Make sure the feed exists; fails harmlessly when it was already created.
  useEffect(() => {
    createFeed(AI_STATUS_FEED_ID).catch(() => {});
  }, [createFeed]);

  const latest = [...(messages ?? [])].sort((a, b) => b.createdAt - a.createdAt)[0];
  const parsed = latest ? aiStatusPayloadSchema.safeParse(latest.data) : null;
  const text = parsed?.success ? parsed.data.text : undefined;

  // Only shown while a run is active.
  if (!isThinking && !active) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 border-t border-surface-border bg-base px-4 py-2 text-xs text-copy-primary"
    >
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#62C073] opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#62C073]" />
      </span>
      <span className="truncate">{text ?? "Ghost AI is working…"}</span>
    </div>
  );
}
