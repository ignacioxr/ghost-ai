# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- 12 Shape Panel

## Current Goal

- Drag shapes from a bottom panel onto the collaborative canvas to create nodes.

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

- 08 Editor Workspace Shell: implemented, `npm run build` passes (manual browser check pending). Route renamed `app/editor/[projectId]` → `[roomId]`; server page redirects unauthenticated users to `/sign-in`, renders `components/editor/access-denied.tsx` for missing/forbidden projects, else `workspace-canvas.tsx` (dark placeholder). `lib/project-access.ts` has `getCurrentIdentity` (Clerk userId + primary email) and `getProjectIfAccessible` (owner or collaborator by primary email); replaced `getAccessibleProject` in `lib/project-data.ts`. `EditorShell` reads `roomId` via `useParams`; when it matches a known project the navbar shows project name + Share button (no behavior) + AI sidebar toggle, and a right-hand AI placeholder sidebar appears (md+). `ProjectSidebar` items now link to `/editor/[id]` and highlight the active room. Restyled to match the design screenshot: three rounded bordered panels with gaps (docked sidebar on md+, overlay on mobile; AI Copilot panel on lg+), navbar with name + "Workspace" subtitle and teal AI button, gridded canvas placeholder with glow.

- 09 Share Dialog: implemented (see build result below; manual browser check pending). `app/api/projects/[projectId]/collaborators/route.ts`: GET (owner or collaborator; returns `isOwner` + list), POST invite and DELETE remove (owner only, 401/403/404; emails lowercased, validated, 409 on duplicate), list enriched via Clerk `getUserList({emailAddress})` with email-only fallback. `components/editor/share-dialog.tsx` (invite form + remove buttons for owners only, read-only list for collaborators, Copy link with 2s `Copied!`). Navbar Share button now opens it via `EditorShell`. No local user table. Restyled to the design screenshot: header with divider, Workspace link card, pill email invite card, "People with access" list with total count, OWNER/COLLABORATOR badges, red trash button. API responses now return `{ owner, collaborators }` (owner profile from Clerk) so the owner row and count render.

- 10 Liveblocks Setup: implemented, `npm run build` passes (manual auth check pending; needs `LIVEBLOCKS_SECRET_KEY` in `.env.local`). `liveblocks.config.ts` defines Presence (`cursor`, `isThinking`) and UserMeta (`id`, `info: {name, avatar, color}`). `lib/liveblocks.ts` cached node client (globalThis), `lib/cursor-color.ts` `getCursorColor(userId)` hashes to a fixed 10-color palette. `app/api/liveblocks-auth/route.ts`: 401 unauthenticated, 400 no room, 403 no project access (via `getProjectIfAccessible`), creates room only if `getRoom` fails, returns session token with name/avatar/color; room ID = project ID. Installed `@liveblocks/node` (spec said all packages installed, but it was missing).

- 11 Base Canvas: implemented, `npm run build` passes (manual browser check pending). `types/canvas.ts` (`CanvasNodeData` {label, color, shape}, `CanvasNode` type `canvasNode`, `CanvasEdge` type `canvasEdge`). `components/editor/liveblocks-canvas.tsx` (client): `LiveblocksProvider` (`/api/liveblocks-auth`), `RoomProvider` (room id, presence `{cursor: null, isThinking: false}`), `ClientSideSuspense` loading state, small class error boundary fallback for connection errors; inner `Canvas` uses `useLiveblocksFlow({suspense: true})` with empty initial nodes/edges, loose `ConnectionMode`, `fitView`, `MiniMap`, dot `Background`. Workspace page (still server-side) now renders it with `roomId`; removed placeholder `workspace-canvas.tsx`. No controls, custom node/edge rendering, persistence or AI added.

- 12 Shape Panel: implemented, `npm run build` passes (manual drag/drop check pending). `lib/canvas-shapes.ts` (shape list with default sizes, `SHAPE_DRAG_MIME`, `DEFAULT_NODE_COLOR`, payload parser), `components/editor/shape-panel.tsx` (floating bottom-center pill with 6 draggable icon buttons; payload `{shape, width, height}`), `components/editor/canvas-node.tsx` (basic bordered rectangle with centered label for all shapes; shape visuals later). `liveblocks-canvas.tsx`: wrapper div with `dragover`/`drop`, `screenToFlowPosition`, new node id `<shape>-<timestamp>-<counter>`, type `canvasNode`, empty label, default color, added via `onNodesChange` add change; `ReactFlowProvider` added; `nodeTypes` registered. `CanvasNodeShape` extended with `cylinder` and `hexagon`.

## Next Up

- Next feature spec (not yet planned). Canvas controls, shape-specific node visuals, edge rendering, persistence, and AI chat are not built.

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- Prisma 7 client is generated to `app/generated/prisma` (gitignored); import from `@/app/generated/prisma/client`.
- Added `@prisma/extension-accelerate` (not in the spec's pre-installed list) because the Accelerate branch of `lib/prisma.ts` requires it.

- `proxy.ts` protects non-public pages and leaves `/api/*` alone; route handlers call `auth()` and return 401 themselves because `auth.protect()` would redirect or 404 in API context.

## Session Notes

- Fixed concrete doc issues in the Liveblocks reference library (broken links, invalid examples, and typos) without changing the working app code paths.
- Run node commands with Node >=20 (shell default is 18; use nvm v22).
- shadcn CLI generated `import { cn } from "cn"` (unrelated npm package); replaced with `@/lib/utils` in components/ui/*.
- `.env.local` lacked sign-in/up URL vars; added `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL` and the two `*_FALLBACK_REDIRECT_URL=/editor` (standard Clerk names). Mirror them in deployment env.
- Next 16 Cache Components: dynamic Clerk provider must sit under `<Suspense>`.
- `createRouteMatcher` is deprecated in Clerk 7; `proxy.ts` uses a plain path check + `auth.protect()`.
- `prisma.config.ts` loads `.env` only (dotenv/config), but `DATABASE_URL` lives in `.env.local`; export it in the shell before running prisma CLI commands.

## Canvas Visual / Drag-Drop Fixes

- Editor shell: canvas (`<main>`) now fills the whole area under the navbar (flush, no card border/radius/padding). Left project sidebar and right AI sidebar are `absolute` overlays (z-30, shadow, translucent) so the dotted canvas shows edge-to-edge; closed left sidebar translates by `100% + 1.5rem` and is `invisible`, so nothing peeks out.
- Canvas: React Flow background uses `--bg-base` with a dotted pattern; minimap restyled, attribution hidden.
- Drag-and-drop: `onDragOver`/`onDrop` moved onto `<ReactFlow>`; shape panel items are `div[draggable]` (buttons are not reliably draggable) and the drop centres the node on the cursor via `screenToFlowPosition`.
- Nodes render their actual shape (SVG per shape; pill uses CSS rounding) instead of always a rectangle.
