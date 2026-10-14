"use client";

import { Link2, Mail, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface Person {
  email: string | null;
  name: string | null;
  imageUrl: string | null;
}

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  isOwner: boolean;
}

async function readError(response: Response) {
  const body = await response.json().catch(() => null);
  return typeof body?.error === "string" ? body.error : "Something went wrong";
}

function Avatar({ person }: { person: Person }) {
  if (person.imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={person.imageUrl}
        alt=""
        className="h-11 w-11 shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ai/30 text-sm font-medium text-ai-text uppercase">
      {(person.name ?? person.email ?? "?")[0]}
    </div>
  );
}

function PersonRow({
  person,
  role,
  action,
}: {
  person: Person;
  role: "owner" | "collaborator";
  action?: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-surface-border bg-base px-4 py-3">
      <Avatar person={person} />
      <div className="min-w-0 flex-1 leading-tight">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-copy-primary">
            {person.name ?? person.email}
          </p>
          <span
            className={
              role === "owner"
                ? "shrink-0 rounded-full border border-brand/40 bg-accent-dim px-2 py-0.5 text-[10px] font-medium tracking-[0.15em] text-brand uppercase"
                : "shrink-0 rounded-full border border-surface-border px-2 py-0.5 text-[10px] font-medium tracking-[0.15em] text-copy-muted uppercase"
            }
          >
            {role}
          </span>
        </div>
        {person.email && (
          <p className="mt-1 truncate text-xs text-copy-muted">
            {person.email}
          </p>
        )}
      </div>
      {action}
    </li>
  );
}

export function ShareDialog({
  open,
  onOpenChange,
  projectId,
  isOwner,
}: ShareDialogProps) {
  const [owner, setOwner] = useState<Person | null>(null);
  const [collaborators, setCollaborators] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const base = `/api/projects/${encodeURIComponent(projectId)}/collaborators`;

  function apply(data: { owner: Person; collaborators: Person[] }) {
    setOwner(data.owner);
    setCollaborators(data.collaborators);
  }

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setEmail("");
    fetch(base)
      .then(async (response) => {
        if (!response.ok) throw new Error(await readError(response));
        return response.json();
      })
      .then((data) => {
        if (!cancelled) apply(data);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, base]);

  useEffect(() => () => clearTimeout(copiedTimer.current), []);

  async function mutate(init: RequestInit) {
    const response = await fetch(base, {
      ...init,
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error(await readError(response));
    apply(await response.json());
  }

  async function handleInvite(event: FormEvent) {
    event.preventDefault();
    if (!email.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await mutate({ method: "POST", body: JSON.stringify({ email }) });
      setEmail("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemove(target: string) {
    setRemoving(target);
    setError(null);
    try {
      await mutate({ method: "DELETE", body: JSON.stringify({ email: target }) });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRemoving(null);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/editor/${projectId}`
      );
      setCopied(true);
      clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy the link");
    }
  }

  const total = (owner ? 1 : 0) + collaborators.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-hidden rounded-3xl border border-surface-border bg-elevated p-0 text-copy-primary ring-0 sm:max-w-xl">
        <DialogHeader className="gap-1 border-b border-surface-border px-6 py-5">
          <DialogTitle className="text-lg font-semibold text-copy-primary">
            Share project
          </DialogTitle>
          <DialogDescription className="text-copy-muted">
            {isOwner
              ? "Invite collaborators, copy the workspace link, and manage access."
              : "Copy the workspace link and see who has access."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto p-6">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-surface-border bg-base p-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-copy-primary">
                Workspace link
              </p>
              <p className="mt-1 text-xs text-copy-muted">
                Share a direct link with teammates after you grant them access.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleCopy}
              className="shrink-0 rounded-full"
            >
              <Link2 className="h-4 w-4" />
              {copied ? "Copied!" : "Copy link"}
            </Button>
          </div>

          {isOwner && (
            <form
              onSubmit={handleInvite}
              className="flex items-center gap-3 rounded-2xl border border-surface-border bg-base p-4"
            >
              <div className="relative flex-1">
                <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-copy-muted" />
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="teammate@company.com"
                  aria-label="Collaborator email"
                  className="h-10 rounded-full pl-9 text-copy-primary placeholder:text-copy-faint"
                  disabled={isSubmitting}
                />
              </div>
              <Button
                type="submit"
                disabled={isSubmitting || !email.trim()}
                className="rounded-full"
              >
                {isSubmitting ? "Inviting…" : "Invite"}
              </Button>
            </form>
          )}

          {error && (
            <p className="text-sm text-red-500" role="alert">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-copy-primary">
                People with access
              </p>
              {!isLoading && (
                <p className="text-xs text-copy-muted">{total} total</p>
              )}
            </div>
            {isLoading ? (
              <p className="py-3 text-sm text-copy-muted">Loading…</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {owner && <PersonRow person={owner} role="owner" />}
                {collaborators.map((c) => (
                  <PersonRow
                    key={c.email}
                    person={c}
                    role="collaborator"
                    action={
                      isOwner && c.email ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove ${c.email}`}
                          onClick={() => void handleRemove(c.email!)}
                          disabled={removing === c.email}
                          className="text-red-500 hover:bg-red-500/10 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : undefined
                    }
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
