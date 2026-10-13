# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- 07 Wire Editor Home

## Current Goal

- Complete the editor home integration: real project data fetching, working dialog actions, friendly error states, and the existing `/editor` experience until a workspace page exists.

## Completed

- 01 Design System: shadcn/ui (base-nova style) with Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea in `components/ui/`; `lucide-react`; `lib/utils.ts` `cn()` (clsx + tailwind-merge); dark-only theme tokens in `app/globals.css` mapped to shadcn variables; `dark` class on `<html>`.

- 02 Editor: `components/editor/editor-navbar.tsx` (3-section fixed-height navbar, sidebar toggle with PanelLeftOpen/Close), `project-sidebar.tsx` (floating overlay, slide-in, `isOpen`, Projects/Shared tabs with empty states, New Project button), `editor-dialog.tsx` (token-styled dialog pattern with title/description/footer; no concrete dialogs yet).
- Editor layout: `app/editor/layout.tsx` renders `components/editor/editor-shell.tsx` (client; owns sidebar open state, composes navbar + floating sidebar over `main`); placeholder `app/editor/page.tsx`.
- 03 Auth: `@clerk/ui` installed; `ClerkProvider` (Clerk `dark` theme + CSS-variable overrides, inside `<Suspense>` in `<body>` for Cache Components) in `app/layout.tsx`; `proxy.ts` protects all routes except sign-in/sign-up paths (from env vars); `/sign-in` and `/sign-up` catch-all pages using `components/auth/auth-shell.tsx` (two-panel on lg, form only on small); `/` redirects to `/editor` or `/sign-in`; `UserButton` in editor navbar right section.

## In Progress

- 04 Project Dialogs: implemented, pending manual verification in browser. `hooks/use-project-dialogs.ts` (dialog/form/loading state), `project-dialogs-provider.tsx` (context), `project-dialogs.tsx` (create w/ live slug, rename, delete), `editor-home.tsx`, sidebar rename/delete on owned projects only, mobile scrim in `editor-shell.tsx`.

- 05 Prisma: implemented and verified (migration `init` applied, `npm run build` passes). `prisma/models/projects.prisma` (`Project`, `ProjectCollaborator`, `ProjectStatus` enum), `lib/prisma.ts` cached singleton (Accelerate if `prisma+postgres://`, else `@prisma/adapter-pg`), client generated to `app/generated/prisma`.

- 06 Project APIs: implemented, `npm run build` passes. `app/api/projects/route.ts` (GET list own, POST create, default name `Untitled Project`) and `app/api/projects/[projectId]/route.ts` (PATCH rename, DELETE; 401 unauthenticated, 403 non-owner, 404 missing). Spec's `PATH` read as `PATCH`. 

- 07 Wire Editor Home: implemented, `npm run build` passes (manual browser check pending). `app/editor/layout.tsx` (server) fetches owned + shared projects via `lib/project-data.ts` (`getUserProjects`; shared = collaborator email matches Clerk user emails) and passes them to `EditorShell` → `ProjectDialogsProvider`. `use-project-dialogs` now calls the real API (create POSTs `{id: roomId, name}` then pushes `/editor/[id]`; rename PATCH + refresh; delete DELETE + redirect to `/editor` if active workspace else refresh). Room ID = `slugify(name)-<6 char suffix>`, previewed in create dialog; `POST /api/projects` accepts optional `id` (validated, 409 on duplicate). Mock data removed from `lib/projects.ts`. Added placeholder workspace route `app/editor/[projectId]/page.tsx` (access-checked via `getAccessibleProject`; shows name + room ID) so create has a navigation target.

## Next Up

- Next feature spec (not yet planned). `/editor/[projectId]` is a placeholder; canvas/Liveblocks not built.

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- Prisma 7 client is generated to `app/generated/prisma` (gitignored); import from `@/app/generated/prisma/client`.
- Added `@prisma/extension-accelerate` (not in the spec's pre-installed list) because the Accelerate branch of `lib/prisma.ts` requires it.

- `proxy.ts` protects non-public pages and leaves `/api/*` alone; route handlers call `auth()` and return 401 themselves because `auth.protect()` would redirect or 404 in API context.

## Session Notes

- Run node commands with Node >=20 (shell default is 18; use nvm v22).
- shadcn CLI generated `import { cn } from "cn"` (unrelated npm package); replaced with `@/lib/utils` in components/ui/*.
- `.env.local` lacked sign-in/up URL vars; added `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL` and the two `*_FALLBACK_REDIRECT_URL=/editor` (standard Clerk names). Mirror them in deployment env.
- Next 16 Cache Components: dynamic Clerk provider must sit under `<Suspense>`.
- `createRouteMatcher` is deprecated in Clerk 7; `proxy.ts` uses a plain path check + `auth.protect()`.
- `prisma.config.ts` loads `.env` only (dotenv/config), but `DATABASE_URL` lives in `.env.local`; export it in the shell before running prisma CLI commands.
