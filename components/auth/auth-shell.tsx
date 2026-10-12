import { FileText, Share2, Sparkles, type LucideIcon } from "lucide-react";

const features: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Sparkles,
    title: "AI Architecture Generation",
    description:
      "Describe your system, AI maps it to nodes and edges on a live canvas.",
  },
  {
    icon: Share2,
    title: "Real-time Collaboration",
    description:
      "Live cursors, presence indicators, and shared node editing across your team.",
  },
  {
    icon: FileText,
    title: "Instant Spec Generation",
    description:
      "Export a complete Markdown technical spec directly from the canvas graph.",
  },
];

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen bg-base font-sans lg:grid-cols-2">
      <aside className="hidden flex-col justify-between border-r border-surface-border bg-surface p-12 lg:flex">
        <div className="flex items-center gap-2">
          <span className="h-5 w-5 rounded-md bg-brand" aria-hidden />
          <span className="text-sm font-semibold text-copy-primary">
            Ghost AI
          </span>
        </div>
        <div className="flex max-w-lg flex-col gap-10">
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl font-semibold leading-tight text-copy-primary">
              Design systems at the speed of thought.
            </h1>
            <p className="text-base text-copy-muted">
              Describe your architecture in plain English. Ghost AI maps it to a
              shared canvas your whole team can refine in real time.
            </p>
          </div>
          <ul className="flex flex-col gap-6">
            {features.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-surface-border bg-accent-dim text-brand">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-copy-secondary">
                    {title}
                  </p>
                  <p className="text-sm text-copy-muted">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-copy-faint">
          © 2026 Ghost AI. All rights reserved.
        </p>
      </aside>
      <section className="flex items-center justify-center bg-base px-4 py-8">
        {children}
      </section>
    </main>
  );
}
