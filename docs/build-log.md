# Build log

Each merge to `main`, in order: the merge commit, its time (MDT), the branch, and the session's reading note.

## 8fdb7fd, 17:18, c0-comments

- Gives: the template's code without its redundant comments; only the comments that state a why the code can't show remain, ten of them reworded to one line.
- Entry points: none new; 119 files across `app/` and `agent/`, 577 lines removed.
- Tables: none.
- Decision: comments only; the bundled output is unchanged (esbuild-identical).
- Gates: app check (162 tests) and build, agent check and `tsc`, all green.

## 1ae004f, 17:19, d1-docs

- Gives: the PRD, the decisions, the stage map, and `/pre-commit` enforcing NFR-1 to NFR-9.
- Entry points: `CLAUDE.md:9`, `docs/DECISIONS.md:42`, `docs/PRD.md:6`, `.claude/skills/pre-commit/SKILL.md:17`.
- Tables: none.
- Decision: `CLAUDE.md` keeps the template's code rules below the stage map.
- Gap: Prettier covers `app/` only; the root docs are formatted by hand.
