# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Not started

## Current Goal

- Define the immediate implementation goal here.

## Completed

- 01 Design System: shadcn/ui (base-nova style) with Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea in `components/ui/`; `lucide-react`; `lib/utils.ts` `cn()` (clsx + tailwind-merge); dark-only theme tokens in `app/globals.css` mapped to shadcn variables; `dark` class on `<html>`.

## In Progress

- None.

## Next Up

- Add the next planned feature unit here.

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- Add decisions that affect the system design or data model.

## Session Notes

- Run node commands with Node >=20 (shell default is 18; use nvm v22).
- shadcn CLI generated `import { cn } from "cn"` (unrelated npm package); replaced with `@/lib/utils` in components/ui/*.
