"use client";

import { useState, type FormEvent } from "react";

import { EditorDialog } from "@/components/editor/editor-dialog";
import { useProjectDialogsContext } from "@/components/editor/project-dialogs-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { slugify } from "@/lib/projects";
import type { ProjectDialogState } from "@/hooks/use-project-dialogs";

export function ProjectDialogs() {
  const { dialog, name, setName, isLoading, close, submit } =
    useProjectDialogsContext();

  // Keep the last open dialog's content mounted while the close animation runs.
  const [lastOpen, setLastOpen] = useState<ProjectDialogState>(dialog);
  if (dialog.type !== "closed" && dialog !== lastOpen) setLastOpen(dialog);
  const view = dialog.type === "closed" ? lastOpen : dialog;

  const isNameDialog = dialog.type === "create" || dialog.type === "rename";
  const isNameView = view.type === "create" || view.type === "rename";
  const canSubmit = !isLoading && (dialog.type === "delete" || name.trim() !== "");
  const slug = slugify(name);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (canSubmit) void submit();
  }

  const cancel = (
    <Button type="button" variant="outline" onClick={close} disabled={isLoading}>
      Cancel
    </Button>
  );

  const nameField = (
    <div className="flex flex-col gap-2">
      <Input
        autoFocus
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Project name"
        aria-label="Project name"
        disabled={isLoading}
      />
      {view.type === "create" && (
        <p className="text-xs text-copy-muted">
          Slug:{" "}
          <span className="font-mono text-copy-secondary">
            {slug || "your-project"}
          </span>
        </p>
      )}
    </div>
  );

  if (view.type === "delete") {
    return (
      <EditorDialog
        open={dialog.type === "delete"}
        onOpenChange={(open) => !open && close()}
        title="Delete project"
        description={`Are you sure you want to delete “${view.project.name}”? This action cannot be undone.`}
        footer={
          <>
            {cancel}
            <Button
              type="button"
              variant="destructive"
              onClick={() => void submit()}
              disabled={isLoading}
            >
              {isLoading ? "Deleting…" : "Delete"}
            </Button>
          </>
        }
      />
    );
  }

  return (
    <EditorDialog
      open={isNameDialog}
      onOpenChange={(open) => !open && close()}
      title={view.type === "rename" ? "Rename project" : "Create project"}
      description={
        view.type === "rename"
          ? `Currently named “${view.project.name}”.`
          : "Give your architecture workspace a name."
      }
      footer={
        <>
          {cancel}
          <Button type="submit" form="project-name-form" disabled={!canSubmit}>
            {isLoading
              ? view.type === "rename"
                ? "Renaming…"
                : "Creating…"
              : view.type === "rename"
                ? "Rename"
                : "Create"}
          </Button>
        </>
      }
    >
      {isNameView && (
        <form id="project-name-form" onSubmit={handleSubmit}>
          {nameField}
        </form>
      )}
    </EditorDialog>
  );
}
