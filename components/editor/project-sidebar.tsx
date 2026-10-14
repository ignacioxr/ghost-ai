"use client";

import { FolderOpen, Pencil, Plus, Trash2, Users, X } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";

import { useProjectDialogsContext } from "@/components/editor/project-dialogs-provider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Project } from "@/lib/projects";
import { cn } from "@/lib/utils";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
}

function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-4 py-10 text-center">
      <div className="text-copy-faint">{icon}</div>
      <p className="text-sm font-medium text-copy-secondary">{title}</p>
      <p className="text-xs text-copy-muted">{description}</p>
    </div>
  );
}

interface ProjectItemProps {
  project: Project;
  isActive: boolean;
  onRename: (project: Project) => void;
  onDelete: (project: Project) => void;
}

function ProjectItem({
  project,
  isActive,
  onRename,
  onDelete,
}: ProjectItemProps) {
  return (
    <li
      className={cn(
        "group flex items-center gap-2 rounded-xl border border-transparent px-3 py-2 hover:bg-subtle",
        isActive && "border-brand/30 bg-accent-dim hover:bg-accent-dim"
      )}
    >
      {isActive && (
        <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
      )}
      <Link
        href={`/editor/${project.id}`}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "min-w-0 flex-1 truncate text-sm",
          isActive ? "font-medium text-copy-primary" : "text-copy-secondary"
        )}
      >
        {project.name}
      </Link>
      {project.isOwner && (
        <div className="flex shrink-0 items-center opacity-100 md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onRename(project)}
            aria-label={`Rename ${project.name}`}
            className="text-copy-muted hover:text-copy-primary"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onDelete(project)}
            aria-label={`Delete ${project.name}`}
            className="text-copy-muted hover:text-state-error"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </li>
  );
}

export function ProjectSidebar({ isOpen, onClose }: ProjectSidebarProps) {
  const { projects, openCreate, openRename, openDelete } =
    useProjectDialogsContext();
  const { roomId } = useParams<{ roomId?: string }>();
  const owned = projects.filter((p) => p.isOwner);
  const shared = projects.filter((p) => !p.isOwner);

  return (
    <aside
      aria-label="Projects"
      aria-hidden={!isOpen}
      inert={!isOpen}
      className={cn(
        "absolute top-3 bottom-3 left-3 z-30 flex w-72 flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface transition-transform duration-200 ease-out md:static md:z-auto md:h-full md:shrink-0",
        isOpen ? "translate-x-0" : "-translate-x-[110%] md:hidden"
      )}
    >
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-surface-border px-4">
        <h2 className="text-sm font-semibold text-copy-primary">Projects</h2>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close sidebar"
          className="text-copy-muted hover:bg-subtle hover:text-copy-primary"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="my-projects" className="min-h-0 flex-1 gap-0">
        <div className="px-4 pt-3">
          <TabsList className="w-full bg-elevated">
            <TabsTrigger value="my-projects">My Projects</TabsTrigger>
            <TabsTrigger value="shared">Shared</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="my-projects" className="min-h-0">
          {owned.length === 0 ? (
            <EmptyState
              icon={<FolderOpen className="h-8 w-8" />}
              title="No projects yet"
              description="Create a project to get started."
            />
          ) : (
            <ul className="flex flex-col gap-0.5 px-2 pt-2">
              {owned.map((project) => (
                <ProjectItem
                  key={project.id}
                  project={project}
                  isActive={project.id === roomId}
                  onRename={openRename}
                  onDelete={openDelete}
                />
              ))}
            </ul>
          )}
        </TabsContent>
        <TabsContent value="shared" className="min-h-0">
          {shared.length === 0 ? (
            <EmptyState
              icon={<Users className="h-8 w-8" />}
              title="Nothing shared with you"
              description="Projects shared with you will appear here."
            />
          ) : (
            <ul className="flex flex-col gap-0.5 px-2 pt-2">
              {shared.map((project) => (
                <ProjectItem
                  key={project.id}
                  project={project}
                  isActive={project.id === roomId}
                  onRename={openRename}
                  onDelete={openDelete}
                />
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>

      <div className="shrink-0 border-t border-surface-border p-4">
        <Button className="w-full" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>
    </aside>
  );
}
