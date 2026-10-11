# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- 02 Editor chrome (navbar, project sidebar, dialog pattern)

## Current Goal

- Build base editor chrome components per `context/feature-specs/02-editor.md`.

## Completed

- 01 Design System: shadcn/ui (base-nova style) with Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea in `components/ui/`; `lucide-react`; `lib/utils.ts` `cn()` (clsx + tailwind-merge); dark-only theme tokens in `app/globals.css` mapped to shadcn variables; `dark` class on `<html>`.

## In Progress

- None.

- 02 Editor: `components/editor/editor-navbar.tsx` (3-section fixed-height navbar, sidebar toggle with PanelLeftOpen/Close), `project-sidebar.tsx` (floating overlay, slide-in, `isOpen`, Projects/Shared tabs with empty states, New Project button), `editor-dialog.tsx` (token-styled dialog pattern with title/description/footer; no concrete dialogs yet).
- Editor layout: `app/editor/layout.tsx` renders `components/editor/editor-shell.tsx` (client; owns sidebar open state, composes navbar + floating sidebar over `main`); placeholder `app/editor/page.tsx`.

## Next Up

- Add the next planned feature unit here.

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- Add decisions that affect the system design or data model.

## Session Notes

- Run node commands with Node >=20 (shell default is 18; use nvm v22).
- shadcn CLI generated `import { cn } from "cn"` (unrelated npm package); replaced with `@/lib/utils` in components/ui/*.
