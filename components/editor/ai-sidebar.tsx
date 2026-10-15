"use client";

import { Bot, Loader2, SendHorizontal, X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useParams } from "next/navigation";
import { useReactFlow } from "@xyflow/react";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import {
  useCreateFeed,
  useCreateFeedMessage,
  useFeedMessages,
  useSelf,
} from "@liveblocks/react/suspense";

import { AiStatusFeed, useAiThinking } from "@/components/editor/ai-status-feed";
import { SpecList } from "@/components/editor/spec-list";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  AI_CHAT_FEED_ID,
  aiChatMessageSchema,
  type AiChatMessage,
} from "@/types/tasks";

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage extends AiChatMessage {
  id: string;
}

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
];

const tabTriggerClass =
  "h-8 flex-none rounded-full px-4 text-sm text-copy-muted hover:text-copy-primary dark:text-copy-muted dark:data-active:border-transparent dark:data-active:bg-ai dark:data-active:text-white data-active:bg-ai data-active:text-white data-active:shadow-none";

export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
  return (
    <aside
      aria-label="AI assistant"
      aria-hidden={!isOpen}
      inert={!isOpen}
      className={cn(
        "absolute top-3 right-3 bottom-3 z-30 hidden w-96 flex-col overflow-hidden rounded-2xl border border-surface-border bg-base/95 shadow-2xl shadow-black/40 backdrop-blur transition-transform duration-300 ease-out lg:flex",
        isOpen ? "translate-x-0" : "invisible translate-x-[calc(100%+1.5rem)]",
      )}
    >
      <div className="flex shrink-0 items-center gap-3 border-b border-surface-border px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-ai/20 text-ai-text">
          <Bot className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <h2 className="text-sm font-semibold text-copy-primary">
            AI Workspace
          </h2>
          <p className="text-xs text-copy-muted">Collaborate with Ghost AI</p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Close AI sidebar"
          onClick={onClose}
          className="ml-auto text-copy-muted hover:text-copy-primary"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="architect" className="min-h-0 flex-1 gap-0">
        <TabsList className="mx-4 mt-3 h-11 w-fit justify-start gap-1 rounded-full bg-subtle/60 p-1">
          <TabsTrigger value="architect" className={tabTriggerClass}>
            AI Architect
          </TabsTrigger>
          <TabsTrigger value="specs" className={tabTriggerClass}>
            Specs
          </TabsTrigger>
        </TabsList>
        <TabsContent value="architect" className="flex min-h-0 flex-col">
          <ArchitectTab />
        </TabsContent>
        <TabsContent value="specs" className="flex min-h-0 flex-col">
          <SpecsTab />
        </TabsContent>
      </Tabs>
    </aside>
  );
}

const AI_SENDER = { id: "ghost-ai", name: "Ghost AI" };

interface ActiveRun {
  runId: string;
  publicToken: string;
}

// Subscribes to a Trigger.dev run and reports once it reaches a final state.
function DesignRunWatcher({
  runId,
  publicToken,
  onFinish,
}: ActiveRun & { onFinish: (result: { ok: boolean; error?: string }) => void }) {
  const { run, error } = useRealtimeRun(runId, { accessToken: publicToken });
  const finishedRef = useRef(false);

  useEffect(() => {
    if (finishedRef.current) return;
    if (error) {
      finishedRef.current = true;
      onFinish({ ok: false, error: error.message });
    } else if (run?.isCompleted) {
      finishedRef.current = true;
      onFinish(
        run.isSuccess
          ? { ok: true }
          : { ok: false, error: "The design run failed." },
      );
    }
  }, [run, error, onFinish]);

  return null;
}

function ArchitectTab() {
  const [draft, setDraft] = useState("");
  const [activeRun, setActiveRun] = useState<ActiveRun | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [sendError, setSendError] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isRunning = isStarting || activeRun !== null;
  const isGenerating = useAiThinking() || isRunning;
  const self = useSelf();
  const roomId = useParams<{ roomId?: string }>().roomId;
  const createFeed = useCreateFeed();
  const createFeedMessage = useCreateFeedMessage();
  const { messages: feedMessages } = useFeedMessages(AI_CHAT_FEED_ID);

  // Make sure the feed exists; fails harmlessly when it was already created.
  useEffect(() => {
    createFeed(AI_CHAT_FEED_ID).catch(() => {});
  }, [createFeed]);

  // Validate every feed message before rendering; invalid ones are dropped.
  const messages = useMemo(() => {
    const valid: ChatMessage[] = [];
    for (const message of feedMessages ?? []) {
      const parsed = aiChatMessageSchema.safeParse(message.data);
      if (parsed.success) valid.push({ id: message.id, ...parsed.data });
    }
    return valid.sort((a, b) => a.timestamp - b.timestamp);
  }, [feedMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  // Grow with content between the min and max heights set on the textarea.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [draft]);

  const postAiMessage = useCallback(
    (content: string) =>
      createFeedMessage(AI_CHAT_FEED_ID, {
        sender: AI_SENDER,
        role: "assistant",
        content,
        timestamp: Date.now(),
      } satisfies AiChatMessage).catch(() => {}),
    [createFeedMessage],
  );

  const handleRunFinish = useCallback(
    (result: { ok: boolean; error?: string }) => {
      postAiMessage(
        result.ok
          ? "I've finished updating the canvas."
          : `Something went wrong: ${result.error ?? "the design run failed."}`,
      );
      setActiveRun(null);
    },
    [postAiMessage],
  );

  async function submit(text: string) {
    const content = text.trim();
    if (!content || isGenerating || !self || !roomId) return;
    const message: AiChatMessage = {
      sender: { id: self.id, name: self.info?.name ?? "Anonymous" },
      role: "user",
      content,
      timestamp: Date.now(),
    };
    setSendError(false);
    try {
      await createFeedMessage(AI_CHAT_FEED_ID, message);
      setDraft("");
    } catch {
      setSendError(true);
      return;
    }

    setIsStarting(true);
    try {
      const response = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: content, roomId }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.runId || !data?.publicToken) {
        throw new Error(data?.error ?? "Failed to start the design run.");
      }
      setActiveRun({ runId: data.runId, publicToken: data.publicToken });
    } catch (error) {
      postAiMessage(
        `Something went wrong: ${error instanceof Error ? error.message : "failed to start the design run."}`,
      );
    } finally {
      setIsStarting(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      submit(draft);
    }
  }

  return (
    <>
      {activeRun && (
        <DesignRunWatcher {...activeRun} onFinish={handleRunFinish} />
      )}
      <ScrollArea className="min-h-0 flex-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ai/20 text-ai-text">
              <Bot className="h-6 w-6" />
            </div>
            <p className="mt-3 text-base font-medium text-copy-primary">
              Ghost AI Architect
            </p>
            <p className="max-w-[16rem] text-sm text-copy-muted">
              Describe your system and I&apos;ll help you design the
              architecture.
            </p>
            <div className="mt-3 flex w-full flex-col gap-3">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setDraft(prompt)}
                  className="w-full rounded-full bg-subtle px-4 py-3 text-left text-sm text-ai-text transition-colors hover:bg-elevated"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex max-w-[85%] flex-col gap-1",
                  message.sender.id === self?.id ? "self-end" : "self-start",
                )}
              >
                <div className="flex items-baseline gap-2 px-1 text-xs text-copy-faint">
                  <span className="font-medium text-copy-muted">
                    {message.sender.name}
                  </span>
                  <time dateTime={new Date(message.timestamp).toISOString()}>
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
                <div
                  className={cn(
                    "rounded-2xl px-3 py-2 text-sm break-words whitespace-pre-wrap",
                    message.role === "assistant"
                      ? "border border-surface-border bg-base text-copy-primary"
                      : "bg-[#62C073] font-medium text-black",
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>
      <AiStatusFeed active={isRunning} />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit(draft);
        }}
        className="shrink-0 border-t border-surface-border p-3"
      >
        <div className="rounded-3xl border border-surface-border bg-surface p-3 focus-within:border-ai">
          <Textarea
            ref={textareaRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isGenerating}
            placeholder="Describe the system you want to design..."
            rows={1}
            className="max-h-[160px] min-h-[72px] resize-none border-0 bg-transparent p-0 text-copy-primary shadow-none placeholder:text-copy-faint focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            {sendError ? (
              <span role="alert" className="text-xs text-red-400">
                Message failed to send. Try again.
              </span>
            ) : (
              <span className="text-xs text-copy-faint">
                Shift+Enter for newline
              </span>
            )}
            <Button
              type="submit"
              disabled={!draft.trim() || isGenerating}
              className="rounded-full bg-[#62C073] px-4 text-black hover:bg-[#62C073]/90 disabled:opacity-50"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SendHorizontal className="h-4 w-4" />
              )}
              {isGenerating ? "Working…" : "Send"}
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}

function SpecsTab() {
  const roomId = useParams<{ roomId?: string }>().roomId;
  const reactFlow = useReactFlow();
  const { messages: feedMessages } = useFeedMessages(AI_CHAT_FEED_ID);
  const [activeRun, setActiveRun] = useState<ActiveRun | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const isGenerating = isStarting || activeRun !== null;

  async function generate() {
    if (isGenerating || !roomId) return;
    setError(null);
    setIsStarting(true);
    try {
      const chatHistory = (feedMessages ?? [])
        .flatMap((message) => {
          const parsed = aiChatMessageSchema.safeParse(message.data);
          return parsed.success ? [parsed.data] : [];
        })
        .sort((a, b) => a.timestamp - b.timestamp)
        .map(({ role, content }) => ({ role, content }));

      const response = await fetch("/api/ai/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          chatHistory,
          nodes: reactFlow.getNodes(),
          edges: reactFlow.getEdges(),
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.runId) {
        throw new Error(data?.error ?? "Failed to start spec generation.");
      }

      const tokenResponse = await fetch("/api/ai/spec/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: data.runId }),
      });
      const tokenData = await tokenResponse.json().catch(() => null);
      if (!tokenResponse.ok || !tokenData?.token) {
        throw new Error(tokenData?.error ?? "Failed to watch spec generation.");
      }
      setActiveRun({ runId: data.runId, publicToken: tokenData.token });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate spec.");
    } finally {
      setIsStarting(false);
    }
  }

  const handleFinish = useCallback((result: { ok: boolean; error?: string }) => {
    if (result.ok) setRefreshKey((key) => key + 1);
    else setError(result.error ?? "Spec generation failed.");
    setActiveRun(null);
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
      {activeRun && <DesignRunWatcher {...activeRun} onFinish={handleFinish} />}
      <Button
        onClick={generate}
        disabled={isGenerating || !roomId}
        className="h-11 w-full shrink-0 rounded-full bg-ai text-base text-white hover:bg-ai/90 disabled:opacity-70"
      >
        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {isGenerating ? "Generating..." : "Generate Spec"}
      </Button>
      {error ? <p className="shrink-0 text-sm text-red-400">{error}</p> : null}
      {roomId ? <SpecList projectId={roomId} refreshKey={refreshKey} /> : null}
    </div>
  );
}
