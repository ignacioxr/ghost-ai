# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- 21 Canvas Autosave

## Current Goal

- Persist the collaborative canvas to Vercel Blob (URL on the Prisma project), autosave with debounce, and load into an empty room.

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

- 13 Node Shape: implemented, `npm run build` result below (manual browser check pending). `components/editor/canvas-node.tsx` exports `ShapeGraphic` (CSS-styled div for rectangle/pill/circle; scalable `preserveAspectRatio="none"` SVG with non-scaling stroke for diamond/hexagon/cylinder; subtle border at rest, brighter when `selected`); `CanvasNodeView` uses it. `shape-panel.tsx`: default drag image hidden, ghost `ShapeGraphic` (same shape, default size, default color) follows cursor via window `dragover`, cleared on `drop`/`dragend`. Drop/node creation unchanged.

- 14 Node Editing: implemented in `components/editor/canvas-node.tsx` (`npm run build` passes; manual browser check pending). `NodeResizer` shown when selected (min 80x56, subtle white/20 lines, small dark handles); resize flows through `onNodesChange`. Double-click label area opens an overlaid autosizing textarea (mirrored span keeps layout stable; placeholder `Label` when empty); typing calls `updateNodeData` (synced via Liveblocks); closes on blur/Escape; textarea uses `nodrag nopan nowheel` and stops pointer/key propagation.

- 15 Nodes Color Toolbar: implemented in `components/editor/canvas-node.tsx` (`npm run build` passes; manual browser check pending). `types/canvas.ts` now holds `NODE_COLORS` (8 pairs from ui-context) and `CanvasNodeData.textColor`; default node color switched to `#1F1F1F`/`#EDEDED` in `lib/canvas-shapes.ts`. `NodeToolbar` (top, offset 12) shown only when selected: one swatch per pair, active swatch ringed in its text color, hover glow in text color, `nodrag nopan` + pointer stopPropagation. Click calls `updateNodeData` with `{color, textColor}` (no server calls). Node text uses `data.textColor` (falls back to palette lookup for older nodes).

- 16 Edge Behavior: implemented, `npm run build` passes (manual browser check pending). New `components/editor/canvas-edge.tsx` (`CanvasEdgeView`): `getSmoothStepPath` + `BaseEdge` (dimmed at rest, full opacity on hover/select, 24px interaction width), double-click to edit label, `EdgeLabelRenderer` positioned at the path's `labelX/labelY`, auto-growing input (`size` follows text), saves on blur/Enter/Escape (typing updates live via `updateEdgeData`), saved labels as pill badges, faint hint on selected unlabeled edge, `nodrag nopan nowheel` + pointer stopPropagation. `CanvasEdge` data is now `{ label?: string }`. `liveblocks-canvas.tsx` registers `canvasEdge: CanvasEdgeView`; new edges use `#f8fafc` stroke, round linecap, closed arrow marker. Node handles (all four sides) restyled as small white dots with dark border, hidden until node hover.

- 17 Canvas Ergonomics: implemented, `npm run build` passes (manual browser check pending). `components/editor/canvas-controls.tsx` pill bar at bottom-left (zoom out / fit view / zoom in | divider | undo / redo); zoom via React Flow instance with 200ms animation, undo/redo via Liveblocks `useUndo`/`useRedo`, disabled + dimmed via `useCanUndo`/`useCanRedo`. `hooks/useKeyboardShortcuts.ts`: window keydown, skips input/textarea/select/contenteditable; `+`/`=` zoom in, `-` zoom out, Cmd/Ctrl+Z undo, Cmd/Ctrl+Shift+Z and Cmd/Ctrl+Y redo. MiniMap removed from `liveblocks-canvas.tsx`.

- 18 Starter Template: implemented, `npm run build` result below (manual browser check pending). `components/editor/starter-templates.ts` (`CanvasTemplate`, `CANVAS_TEMPLATES`: Microservices, CI/CD Pipeline, Event-Driven System; `node`/`edge` helpers using shared types + `NODE_COLORS`). `starter-templates-modal.tsx` (dialog, scrollable card grid, lightweight SVG preview computed from node bounds, Import button calls `onImport` then closes). `starter-templates-context.tsx` bridges `EditorShell` (owns open state, navbar "Templates" button) to `LiveblocksCanvas`, which renders the modal; import removes all existing edges + nodes via `onEdgesChange`/`onNodesChange`, adds template items, then `fitView`. No saving, custom templates, or persistence.

- 19 Presence Avatars & Cursors: implemented, `npm run build` result below (manual multi-user check pending). Presence type renamed `isThinking` → `thinking` in `liveblocks.config.ts` per spec. `components/editor/presence-avatars.tsx` (top-right of canvas: up to 5 overlapping collaborator avatars with photo/initials fallback and ring, `+N` chip, divider only when collaborators exist, then Clerk `UserButton`; current user filtered out via Clerk `useUser` id). `components/editor/live-cursors.tsx` (pointer + name badge in presence color, rendered in `ViewportPortal`, counter-scaled by zoom). `liveblocks-canvas.tsx` broadcasts cursor in flow coordinates on `onMouseMove`, clears on `onMouseLeave`. Clerk `UserButton` always stays in the navbar (not in the canvas group); the canvas group shows collaborators only and renders nothing when alone.

- 20 AI Sidebar Shell: implemented, `npm run build` result below (manual browser check pending). `components/editor/ai-sidebar.tsx` (`AiSidebar`, `isOpen`/`onClose` controlled by `EditorShell`; floating right panel with slide-in/out transform, `bg-base/95`, `border-surface-border`). Header: bot icon, "AI Workspace" / "Collaborate with Ghost AI", close button. shadcn `Tabs`: AI Architect (scrollable `ScrollArea`, empty state with 3 starter chips that fill the input, local-only user/assistant bubble styles, auto-resizing `Textarea` 72-160px, Enter sends / Shift+Enter newline, send button) and Specs (Generate Spec button + static demo spec card with disabled download). Spec token names mapped to existing tokens: `bg-accent`/`text-accent` -> `bg-ai`/`text-ai-text`, `text-accent-text` -> `text-ai-text`, `bg-brand-dim` -> `bg-accent-dim`, `text-primary-text`/`text-muted-text` -> `text-copy-primary`/`text-copy-muted` (shadcn `accent` is a neutral surface here). Sending only appends a user message locally; no AI replies or persistence. Inline placeholder aside removed from `editor-shell.tsx`.

- 21 Canvas Autosave: implemented, `npm run build` passes (manual browser check pending). Installed `@vercel/blob`. Schema already had `Project.canvasJsonPath`, so no migration. `app/api/projects/[projectId]/canvas/route.ts`: GET (owner/collaborator; reads blob via `get`, returns `{nodes, edges}`, empty when nothing saved) and PUT (validates arrays, `put` to `canvas/{projectId}.json` with overwrite, stores URL in `canvasJsonPath`). The Blob store behind `BLOB_READ_WRITE_TOKEN` is private, so access is `private` and reads go through the server. Spec's `/hook` folder = existing `hooks/`: `hooks/useCanvasAutosave.ts` (2s debounce, skips unchanged snapshots, status `idle|saving|saved|error`, disabled until the load check finishes so an empty room cannot overwrite a saved canvas). `liveblocks-canvas.tsx` loads the saved canvas only if the room has no nodes/edges (re-checked after fetch). `save-status-context.tsx` bridges canvas state to the navbar; new Save button in `editor-navbar.tsx` shows Save/Saving…/Saved/Error and saves immediately on click.
- Autosave follow-ups: snapshots now strip `measured`/`dragging`/`selected` (they caused spurious saves after idle). `components/editor/save-indicator.tsx` floats a "Saving…" / "Saved" / "Save failed" pill above the shape panel; "Saved" hides after 2s.

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
