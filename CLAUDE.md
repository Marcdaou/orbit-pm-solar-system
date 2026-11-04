# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ MANDATORY: Keep this file self-improving (read this first, every session)

This file is a living log. Keeping it current is **part of the task, not an optional extra**. A feature or a correction is **not finished** until its line has been added to the "Change & Correction Log" at the bottom of this file.

**You MUST add exactly one new line to the log, in the same turn, whenever either of these happens:**

1. **A new feature is implemented.** This includes any user-visible behavior change, new component, new config value, or changed interaction. Describe what was built and where.
2. **The user corrects you on anything.** This includes a wrong assumption, a bug you introduced, a misread request, a wrong approach, or a style or process complaint. Describe the mistake and the correct behavior so it is never repeated.

**Rules for every log line:**
- One line only. Be specific: name the file, constant or behavior involved.
- Format: `- [FEATURE] <what we did>  — YYYY-MM-DD HH:MM` or `- [CORRECTION] <what went wrong → what is right>  — YYYY-MM-DD HH:MM`
- The timestamp goes at the **end** of the line. Get the real current time (e.g. run `date "+%Y-%m-%d %H:%M"`). Never guess or reuse an old timestamp.
- Append new lines at the bottom of the log. Never delete or rewrite old entries. If an old entry is now wrong, add a new `[CORRECTION]` line instead.
- Do this immediately after the work or the correction, before your final reply. Do not wait to be asked, and do not batch entries up for later.
- Read the log before starting work, so you don't repeat a logged mistake.

If you are about to end your turn after a feature or a correction and have not touched this file, stop and add the line first.

## ⚠️ MANDATORY: Test every finished feature in Chrome

Every time a new feature is complete, **automatically test it in the browser using Claude in Chrome (`mcp__claude-in-chrome__*`) without being asked**. A feature is not done until it has been exercised in the running app.

- Make sure the dev server is running (`npm run dev`; it may be on 5174 if 5173 is taken) and open the app in a new tab.
- Exercise the feature as a user would, then check the result in the UI and the console for errors. `tsc` and `npm run build` passing is not a substitute.
- Report honestly in your reply what you tested and what happened. If you could not test something, or a test failed, say so. Never claim it was verified when it wasn't.
- Close any tab you opened when you are done.
- Planets orbit continuously, so coordinates go stale quickly. Hover a planet to pause it and re-read its position before dragging.

## Project

Orbit PM: a frontend-only proof-of-concept project manager. The sun sits in the center and tasks orbit it. There is no backend. State persists to localStorage only.

## Commands

- `npm run dev`: Vite dev server. It falls back to 5174 if 5173 is taken.
- `npm run build`: `tsc -b && vite build`. This is the only check there is. There is no test runner and no linter.
- `npx tsc --noEmit`: quick typecheck. `tsconfig.json` is strict with `noUnusedLocals`, so unused imports fail the build.

## Architecture

Stack: Vite 6, React 18, TypeScript, Tailwind v4 (via `@tailwindcss/vite`, with `@import "tailwindcss"` in `src/index.css`), zustand 5.

**State (`src/store.ts`)**: one zustand store with the `persist` middleware (localStorage key `orbit-pm-v1`). It is seeded with demo members, sprints and tasks on first load. If you change the persisted shape, bump the key or add a migration. Otherwise old localStorage data will break the app.

**Domain config (`src/constants.ts`)**: `ORBITS` is the source of truth for the status → ring mapping (radius fraction, color, angular speed), ordered inner to outer: discuss, progress, ready, testing. `done` is not an orbit. Priority size (`PRIORITY_SIZES`), priority color and member colors also live here.

**`SolarSystem.tsx` is the core and is not obvious from any single file:**
- One `requestAnimationFrame` loop keeps each task's angle in a ref `Map` and writes `transform` straight to the DOM nodes. React state is never updated per frame. Don't move orbit position into React state.
- Hover pauses a task through `hoveredRef`. The React `hover` state exists only to show the tooltip.
- Drag uses pointer events with pointer capture. A pointer move under 5px counts as a click, which opens the edit modal. A real drag finds the nearest ring by distance from the center (`classify`). Dropping more than 40px past the outer ring means `done` ("Eject to complete").
- When a task goes from visible to `done`, an effect adds a transient `departing` entry. It renders a ghost with the CSS `animate-fly-out` keyframe, driven by the `--fly-x` / `--fly-y` variables, and is removed after about 1300ms. Completed tasks then show in `CompletedPanel`.
- `TaskPlanet` and `PlanetBody` (in `TaskPlanet.tsx`) draw a planet. The fly-out ghost reuses `PlanetBody`. Anything that depends on planet size has to use `PRIORITY_SIZES`, including the ghost offset in `SolarSystem`.

**UI shell**: `App.tsx` holds the modal state. `Modal.tsx` is the dialog shell and also exports the shared form class strings (`inputCls`, `labelCls`, `primaryBtn`, `ghostBtn`, `dangerBtn`) that the other modals import. Keyframes and animation classes (`animate-sun-pulse`, `animate-corona`, `animate-twinkle`, `animate-fly-out`) are in `src/index.css`.

## Change & Correction Log

Append one line per feature or correction (see the mandatory section at the top). Newest at the bottom.

- [FEATURE] Planet size now scales with task priority via `PRIORITY_SIZES` in `src/constants.ts` (low 26, med 38, high 54), applied in `TaskPlanet.tsx` and the fly-out ghost offset in `SolarSystem.tsx`.  — 2026-11-04 16:45
- [FEATURE] Added this self-improving log and the mandatory logging instruction at the top of CLAUDE.md.  — 2026-11-04 16:45
- [FEATURE] Each orbit ring label now shows a live task count (e.g. "In Progress · 3") for the active sprint: `count` prop in `OrbitRing.tsx`, computed from `visible` in `SolarSystem.tsx`.  — 2026-11-04 16:49
- [FEATURE] Added a mandatory rule near the top of CLAUDE.md: every completed feature must be tested automatically in Chrome via Claude in Chrome.  — 2026-11-04 16:53
- [FEATURE] Filter, search & focus mode: `src/filters.ts` (TaskFilters, matchesFilters: AND across categories, OR within) + `FilterBar.tsx` (search box with "/" shortcut, assignee/priority/status chips, match count, Clear all) at top-left; non-matching planets fade to 15% and scale 0.6 in `TaskPlanet.tsx`; header avatars now spotlight a single member (sets assignees=[id]), replacing the old `assigneeFilter`.  — 2026-11-04 18:20
- [FEATURE] Undo/redo, shortcuts & JSON backup: `past`/`future` snapshot stacks in `src/store.ts` (every data mutation records one; `setActiveSprint` doesn't; not persisted via `partialize`, cap 100) with Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z / Ctrl+Y in `App.tsx` and ↶/↷ header buttons; keys 1–4 send the hovered planet to that ring (`SolarSystem.tsx`); Export/Import buttons in `Header.tsx` using `src/backup.ts` (validated `parseBackup`, import is undoable via `replaceAll`).  — 2026-11-04 18:22
