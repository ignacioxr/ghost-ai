"use client";

import { Bot, Download, FileText, SendHorizontal, X } from "lucide-react";
import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
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
        <TabsContent value="specs" className="min-h-0 overflow-y-auto">
          <SpecsTab />
        </TabsContent>
      </Tabs>
    </aside>
  );
}

function ArchitectTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const nextId = useRef(0);

  // Grow with content between the min and max heights set on the textarea.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [draft]);

  function submit(text: string) {
    const content = text.trim();
    if (!content) return;
    setMessages((prev) => [
      ...prev,
      { id: nextId.current++, role: "user", content },
    ]);
    setDraft("");
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
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm break-words whitespace-pre-wrap",
                  message.role === "user"
                    ? "self-end border-2 border-brand/50 bg-accent-dim text-copy-primary"
                    : "self-start border border-surface-border bg-elevated text-ai-text",
                )}
              >
                {message.content}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
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
            placeholder="Describe the system you want to design..."
            rows={1}
            className="max-h-[160px] min-h-[72px] resize-none border-0 bg-transparent p-0 text-copy-primary shadow-none placeholder:text-copy-faint focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-xs text-copy-faint">
              Shift+Enter for newline
            </span>
            <Button
              type="submit"
              disabled={!draft.trim()}
              className="rounded-full bg-ai px-4 text-white hover:bg-ai/90"
            >
              <SendHorizontal className="h-4 w-4" />
              Send
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}

function SpecsTab() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <Button className="h-11 w-full rounded-full bg-ai text-base text-white hover:bg-ai/90">
        Generate Spec
      </Button>
      <div className="flex flex-col gap-3 rounded-3xl border border-surface-border bg-elevated p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-subtle/60 text-copy-secondary">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-medium text-copy-primary">
              System Architecture v1
            </p>
            <p className="mt-1 line-clamp-3 text-sm text-copy-muted">
              Microservices design with API gateway, authentication service, and
              event-driven communication between bounded contexts.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          disabled
          className="self-end rounded-full border-surface-border bg-transparent px-4 text-copy-muted"
        >
          <Download className="h-4 w-4" />
          Download
        </Button>
      </div>
    </div>
  );
}
