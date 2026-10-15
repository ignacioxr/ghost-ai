"use client";

import { Download } from "lucide-react";

import {
  CANVAS_TEMPLATES,
  type CanvasTemplate,
} from "@/components/editor/starter-templates";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PREVIEW_WIDTH = 280;
const PREVIEW_HEIGHT = 190;
const PREVIEW_PADDING = 24;

function TemplatePreview({ template }: { template: CanvasTemplate }) {
  const nodes = template.nodes;
  const minX = Math.min(...nodes.map((n) => n.position.x));
  const minY = Math.min(...nodes.map((n) => n.position.y));
  const maxX = Math.max(...nodes.map((n) => n.position.x + (n.width ?? 0)));
  const maxY = Math.max(...nodes.map((n) => n.position.y + (n.height ?? 0)));
  const boundsWidth = maxX - minX || 1;
  const boundsHeight = maxY - minY || 1;
  const scale = Math.min(
    (PREVIEW_WIDTH - PREVIEW_PADDING * 2) / boundsWidth,
    (PREVIEW_HEIGHT - PREVIEW_PADDING * 2) / boundsHeight,
  );
  const offsetX = (PREVIEW_WIDTH - boundsWidth * scale) / 2 - minX * scale;
  const offsetY = (PREVIEW_HEIGHT - boundsHeight * scale) / 2 - minY * scale;

  const rects = new Map(
    nodes.map((n) => {
      const w = (n.width ?? 0) * scale;
      const h = (n.height ?? 0) * scale;
      return [
        n.id,
        { x: n.position.x * scale + offsetX, y: n.position.y * scale + offsetY, w, h },
      ];
    }),
  );

  return (
    <svg
      viewBox={`0 0 ${PREVIEW_WIDTH} ${PREVIEW_HEIGHT}`}
      className="block w-full border-b border-surface-border bg-base"
      aria-hidden
    >
      {template.edges.map((e) => {
        const from = rects.get(e.source);
        const to = rects.get(e.target);
        if (!from || !to) return null;
        return (
          <line
            key={e.id}
            x1={from.x + from.w / 2}
            y1={from.y + from.h / 2}
            x2={to.x + to.w / 2}
            y2={to.y + to.h / 2}
            stroke="rgba(255,255,255,0.25)"
            strokeWidth={1}
          />
        );
      })}
      {nodes.map((n) => {
        const r = rects.get(n.id);
        if (!r) return null;
        const { x, y, w, h } = r;
        const cx = x + w / 2;
        const cy = y + h / 2;
        const common = {
          fill: n.data.color,
          stroke: n.data.textColor,
          strokeOpacity: 0.35,
          strokeWidth: 0.75,
        };
        switch (n.data.shape) {
          case "circle":
            return <ellipse key={n.id} cx={cx} cy={cy} rx={w / 2} ry={h / 2} {...common} />;
          case "pill":
            return <rect key={n.id} x={x} y={y} width={w} height={h} rx={h / 2} {...common} />;
          case "diamond":
            return (
              <polygon
                key={n.id}
                points={`${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}`}
                {...common}
              />
            );
          case "hexagon":
            return (
              <polygon
                key={n.id}
                points={`${x + w * 0.25},${y} ${x + w * 0.75},${y} ${x + w},${cy} ${x + w * 0.75},${y + h} ${x + w * 0.25},${y + h} ${x},${cy}`}
                {...common}
              />
            );
          case "cylinder":
            return <rect key={n.id} x={x} y={y} width={w} height={h} rx={Math.min(w, h) * 0.25} {...common} />;
          default:
            return <rect key={n.id} x={x} y={y} width={w} height={h} rx={2} {...common} />;
        }
      })}
    </svg>
  );
}

interface StarterTemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (template: CanvasTemplate) => void;
}

export function StarterTemplatesModal({
  open,
  onOpenChange,
  onImport,
}: StarterTemplatesModalProps) {
  const isMac =
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
  const undoShortcut = isMac ? "⌘Z" : "Ctrl+Z";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[calc(100vw-2rem)] flex-col gap-6 rounded-3xl border border-surface-border bg-elevated p-8 text-copy-primary ring-0 sm:max-w-5xl">
        <DialogHeader className="gap-3">
          <DialogTitle className="text-3xl font-semibold tracking-tight text-copy-primary">
            Import Template
          </DialogTitle>
          <DialogDescription className="text-base text-copy-muted">
            Choose a starter template to pre-populate your canvas. Any existing
            nodes will be replaced — use{" "}
            <kbd className="rounded-md border border-surface-border px-1.5 py-0.5 font-sans text-xs">
              {undoShortcut}
            </kbd>{" "}
            to undo.
          </DialogDescription>
        </DialogHeader>
        <div className="grid min-h-0 grid-cols-1 gap-5 overflow-y-auto md:grid-cols-3">
          {CANVAS_TEMPLATES.map((template) => (
            <div
              key={template.id}
              className="flex flex-col overflow-hidden rounded-3xl border border-surface-border bg-surface"
            >
              <TemplatePreview template={template} />
              <div className="flex flex-1 flex-col gap-2 p-5">
                <h3 className="text-base font-semibold text-copy-primary">
                  {template.name}
                </h3>
                <p className="text-sm leading-relaxed text-copy-muted">
                  {template.description}
                </p>
                <Button
                  variant="outline"
                  className="mt-auto h-11 w-full rounded-xl border-surface-border bg-transparent text-base text-copy-primary hover:bg-subtle hover:text-copy-primary"
                  onClick={() => {
                    onImport(template);
                    onOpenChange(false);
                  }}
                >
                  <Download className="h-4 w-4" />
                  Import
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
