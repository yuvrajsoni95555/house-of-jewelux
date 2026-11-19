# HOUSE OF JEWELUX — DEVELOPER GUIDE

## 1. Code Standards & Conventions

### JavaScript / Node.js
- Use strict mode (`'use strict'`) in backend modules.
- Use `async/await` and handle errors via `next(err)` or explicit try/catch blocks.
- Keep business logic inside controllers (`server/controllers/`), not in route definitions.
- Avoid mutating persistent database arrays in memory without synchronizing to disk via `writeJSON`.

### CSS & Design Tokens
- Never introduce arbitrary hex codes directly into inline elements without referencing the approved palette:
  - `--color-cacao-deep: #1A120E` (Charcoal Cacao)
  - `--color-espresso: #3A2418` (Deep Heritage Brown)
  - `--color-cognac-amber: #6B4A2E` (Muted Gold Dark)
  - `--color-antique-gold: #A88462` (Antique Champagne Gold)
  - `--color-warm-stone: #D5C4AE` (Warm Stone / Ivory)
  - `--color-stone-muted: #4A4A46` (Stone Muted)
- Never set initial `opacity: 0` in CSS for headings or body copy without progressive enhancement safeguards.

---

## 2. Git Workflow
- Always verify working directory state with `git status` before committing.
- Commit in focused, logical increments with semantic messages (`feat:`, `fix:`, `refactor:`, `docs:`).
