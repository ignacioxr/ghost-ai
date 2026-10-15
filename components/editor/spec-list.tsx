"use client";

import { Download, FileText, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SpecItem {
  id: string;
  filename: string;
  createdAt: string;
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

function specUrl(projectId: string, specId: string) {
  return `/api/projects/${projectId}/specs/${specId}/download`;
}

function downloadSpec(projectId: string, specId: string) {
  const link = document.createElement("a");
  link.href = specUrl(projectId, specId);
  link.click();
}

export function SpecList({
  projectId,
  refreshKey = 0,
}: {
  projectId: string;
  refreshKey?: number;
}) {
  const [specs, setSpecs] = useState<SpecItem[]>([]);
  const [selected, setSelected] = useState<SpecItem | null>(null);

  // Silent background load of saved specs: no spinner or error state, the
  // empty state is the default and only changes if specs actually exist.
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/projects/${projectId}/specs`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) return;
        const data = (await res.json()) as { specs: SpecItem[] };
        setSpecs(data.specs);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [projectId, refreshKey]);

  return (
    <>
      {specs.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 pb-16 text-center">
          <FileText className="h-10 w-10 text-copy-muted/70" strokeWidth={1.5} />
          <p className="text-sm text-copy-muted">
            No specs yet. Generate one above.
          </p>
        </div>
      ) : (
        <ScrollArea className="min-h-0 flex-1">
          <ul className="flex flex-col gap-2 pr-3">
            {specs.map((spec) => (
              <li
                key={spec.id}
                className="flex items-center gap-2 rounded-2xl border border-surface-border bg-elevated pr-2 transition-colors hover:bg-subtle/40"
              >
                <button
                  type="button"
                  onClick={() => setSelected(spec)}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl p-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ai"
                >
                  <FileText className="h-4 w-4 shrink-0 text-copy-secondary" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-copy-primary">
                      {spec.filename}
                    </span>
                    <span className="block text-xs text-copy-muted">
                      {dateFormatter.format(new Date(spec.createdAt))}
                    </span>
                  </span>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Download ${spec.filename}`}
                  onClick={() => downloadSpec(projectId, spec.id)}
                  className="shrink-0 text-copy-muted hover:text-copy-primary"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}

      <SpecPreviewDialog
        projectId={projectId}
        spec={selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
}

function SpecPreviewDialog({
  projectId,
  spec,
  onClose,
}: {
  projectId: string;
  spec: SpecItem | null;
  onClose: () => void;
}) {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const specId = spec?.id;

  useEffect(() => {
    if (!specId) return;
    const controller = new AbortController();
    setContent(null);
    setError(false);
    fetch(specUrl(projectId, specId), { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load spec");
        setContent(await res.text());
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(true);
      });
    // Content is dropped as soon as the dialog closes or changes.
    return () => {
      controller.abort();
      setContent(null);
    };
  }, [projectId, specId]);

  return (
    <Dialog open={!!spec} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-3 border border-surface-border bg-base sm:max-w-3xl">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-copy-primary">{spec?.filename}</DialogTitle>
          <DialogDescription className="text-copy-muted">
            {spec ? dateFormatter.format(new Date(spec.createdAt)) : null}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="min-h-0 flex-1 rounded-xl border border-surface-border bg-elevated">
          <div className="max-h-[60vh] px-4 py-3 text-sm text-copy-secondary [&_a]:text-ai-text [&_a]:underline [&_code]:rounded [&_code]:bg-subtle/60 [&_code]:px-1 [&_h1]:mb-3 [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:text-copy-primary [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-copy-primary [&_h3]:mt-4 [&_h3]:mb-1 [&_h3]:font-semibold [&_h3]:text-copy-primary [&_li]:my-0.5 [&_ol]:ml-5 [&_ol]:list-decimal [&_p]:my-2 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-subtle/60 [&_pre]:p-3 [&_table]:my-3 [&_td]:border [&_td]:border-surface-border [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-surface-border [&_th]:px-2 [&_th]:py-1 [&_ul]:ml-5 [&_ul]:list-disc">
            {error ? (
              <p className="text-red-400">Couldn&apos;t load this spec.</p>
            ) : content === null ? (
              <div className="flex justify-center py-8 text-copy-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => spec && downloadSpec(projectId, spec.id)}
            className="rounded-full border-surface-border bg-transparent px-4 text-copy-primary"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button onClick={onClose} className="rounded-full px-4">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
