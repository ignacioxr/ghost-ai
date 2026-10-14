import { Compass } from "lucide-react";

export function WorkspaceCanvas() {
  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden bg-base px-6 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-[radial-gradient(ellipse_at_top,rgba(0,200,212,0.12),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 bottom-0 h-1/2 w-1/2 bg-[radial-gradient(ellipse_at_bottom_right,rgba(124,92,255,0.12),transparent_70%)]"
      />
      <div className="relative flex max-w-2xl flex-col items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-surface-border bg-surface text-brand">
          <Compass className="h-9 w-9" />
        </div>
        <p className="text-xs font-medium tracking-[0.25em] text-copy-muted uppercase">
          Workspace shell
        </p>
        <h2 className="text-3xl font-semibold text-balance text-copy-primary">
          Canvas and collaboration tooling land here next.
        </h2>
        <p className="text-sm leading-relaxed text-copy-muted">
          This room is ready for the shared architecture canvas, durable AI
          workflows, and real-time presence. For now, the shell is wired with
          project context and navigation only.
        </p>
      </div>
    </div>
  );
}
