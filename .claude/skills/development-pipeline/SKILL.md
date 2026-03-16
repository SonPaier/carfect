---
name: development-pipeline
description: 'Multi-agent development pipeline for feature implementation. Use when building new features, major changes, or multi-file modifications. Orchestrates 10 steps from brainstorm to merge with retrospective.'
---

# Multi-Agent Development Pipeline

Orchestrate feature development through 10 sequential steps. Each step uses specialized skills and agents. No step can be skipped.

## When to Use

- New features requiring design decisions
- Multi-file changes spanning UI + backend
- Changes that benefit from structured planning

**Don't use for:**

- Single-file bugfixes (use systematic-debugging directly)
- Config changes, dependency updates
- Tasks the user explicitly wants done quickly without process

## Pipeline Overview

```
1. Brainstorm      → spec.md
2. System Design   → design conventions confirmed
3. Plan            → plan.md
4. Implement       → working code on branch
5. Test            → test suite (spec-based)
6. Simplify        → lean, readable code
7. Find Bugs + Security → issues found & fixed
8. Final Review    → spec compliance verified
9. Merge           → PR or merged branch
10. Retrospective  → lessons → MEMORY.md
```

## Step 1: Brainstorm

**Skill:** `brainstorming`

Turn the user's idea into a written specification through collaborative dialogue.

- Ask questions one at a time (prefer multiple choice)
- Propose 2-3 approaches with trade-offs
- Present design in sections, get approval per section
- Output: `spec.md` saved and committed

**Gate:** No planning or coding until spec is approved by user.

## Step 2: System Design Check

**Skill:** `carfect-design-system`

Before planning implementation, verify design decisions against project conventions:

- Component placement: `@shared/ui` vs `apps/carfect/src/components/ui/`
- Shared lib usage: `@shared/utils`, existing hooks
- UI patterns: shadcn/ui components, Tailwind v3, form patterns (RHF + Zod)
- Layout patterns: close buttons, fixed footers, admin content width
- Data patterns: Supabase queries, TanStack Query, optimistic updates

**Gate:** Design decisions documented in plan. Don't discover conventions during implementation.

## Step 3: Plan

**Skill:** `writing-plans`

Break the approved spec into a task list with exact file paths, code snippets, and verification commands.

- Map file structure before defining tasks
- Each task: 2-5 minutes of work, atomic
- Include file ownership per task (no overlap between tasks)
- Save to `plan.md` and commit

**Gate:** No implementation until plan is approved by user.

## Step 4: Implement

**Skill:** `subagent-driven-development`

Execute the plan using fresh subagents per task. Sequential execution (not parallel).

**Task order:** Backend/data tasks first, then frontend tasks. This ensures:

- DB migrations exist before queries reference them
- Types/hooks exist before components import them
- API endpoints exist before UI calls them

**Per task:**

1. Dispatch implementer subagent with full task text + context
2. Implementer builds the code and commits
3. Dispatch spec reviewer — does code match plan?
4. Dispatch quality reviewer — is code clean?
5. If either reviewer finds issues → implementer fixes → re-review
6. Mark task complete, move to next

**Implementer rules:**

- Follow existing codebase patterns
- Use `carfect-design-system` conventions
- Run `pnpm --filter carfect test -- --run` after each task
- Commit after each task passes

**Gate:** All tasks complete, all tests passing.

## Step 5: Test

Write tests AFTER implementation. Not TDD.

**Critical rule: Tests are written from spec.md, NOT from the code.**

The test agent:

1. Reads `spec.md` to understand expected behavior
2. Writes tests that verify spec requirements
3. Runs tests
4. If a test FAILS: **the implementation is wrong, not the test**
5. Reports failures back to implementation agent for fixing
6. NEVER modifies a failing test to make it pass

<HARD-RULE>
Test agent writes tests based on what the code SHOULD do (from spec).
If test fails, implementation agent fixes the CODE.
Test agent NEVER changes test assertions to match buggy behavior.
This is the single most important rule in this pipeline.
</HARD-RULE>

**Test coverage:**

- Unit tests for UI components (rendering, interactions, states)
- Unit tests for logic (utils, hooks, calculations)
- Edge cases (empty inputs, null values, boundary conditions)
- Regression tests for any bugs found during development

**Testing stack:** Vitest + @testing-library/react, `vi.mock('@supabase/supabase-js')`, `userEvent.setup()` before each test.

**Gate:** All tests passing. `pnpm --filter carfect test -- --run` exits 0.

## Step 6: Simplify & Refactor

**Skill:** `simplify`

Three parallel review agents:

1. **Code Reuse** — find existing utilities that replace new code, flag duplicates
2. **Code Quality** — redundant state, parameter sprawl, copy-paste, leaky abstractions, naming, function length, readability
3. **Efficiency** — unnecessary work, missed concurrency, hot-path bloat, memory leaks

Fix all found issues. Run tests after each fix.

**Gate:** All tests still passing after simplification.

## Step 7: Find Bugs + Security

**Skills:** `find-bugs` + `security-review` (run as parallel agents)

**Bug finder (find-bugs):**

- Full diff review against base branch
- Attack surface mapping (inputs, queries, auth checks, external calls)
- OWASP checklist per file
- Edge cases, race conditions, business logic errors

**Security review (security-review):**

- Injection (SQL, command, XSS)
- Auth/AuthZ on all protected operations
- IDOR checks
- Secrets in code
- Information disclosure in errors/logs

**Severity handling:**

- Critical/High: fix before proceeding
- Medium/Low: fix or document as tech debt

**Gate:** Zero Critical/High issues. All fixes verified with tests.

## Step 8: Final Review

**Skill:** `requesting-code-review`

Two-stage review:

**Stage 1 — Spec compliance:**

- Every requirement in spec.md has implementation
- No features added beyond spec (YAGNI)
- API surface matches spec

**Stage 2 — Code quality:**

- Consistent with codebase patterns
- Error messages are useful
- No unresolved TODOs
- Test coverage adequate

**If blockers found:** send back to relevant step (implement, simplify, or security).

**Gate:** APPROVED status from reviewer.

## Step 9: Merge

**Skill:** `finishing-a-development-branch`

1. Run full test suite one final time
2. Verify build passes
3. Present options: merge locally / create PR / keep branch / discard
4. Execute chosen option
5. Clean up worktree if applicable

**Verification (from verification-before-completion):**

- Run test command, see output, THEN claim it passes
- Run build, see exit 0, THEN claim it builds
- No "should work" — only evidence

## Step 10: Retrospective

After merge, ask the user:

> "Co poszlo dobrze, co zle? Czego sie nauczylem z tej sesji?"

Then:

1. Identify new patterns, gotchas, preferences discovered during this feature
2. Update `/Users/tomasznastaly/.claude/projects/-Users-tomasznastaly-Documents-programming-carfect/memory/MEMORY.md` with:
   - New architectural decisions
   - Codebase gotchas discovered
   - User preferences learned
   - Testing patterns that worked/failed
3. Commit the memory update

**Examples of what to capture:**

- "Supabase `.or()` requires escaping special chars with backslash"
- "User prefers sequential implementation, not parallel FE+BE"
- "Invoice module uses shared lib, not app-specific components"
- "User wants tests after implementation, never TDD"

## Feedback Loops

**Local loop (Steps 7-8 → Step 4):**
Bug finder, security, or reviewer finds implementation issue → send back to implementer. Spec doesn't change, only code.

**Full loop (Step 8 → Step 1):**
Reviewer finds spec was wrong or incomplete → back to brainstorming. Rare but critical.

## Quick Reference

| Step | Agent         | Skill                          | Input             | Output           |
| ---- | ------------- | ------------------------------ | ----------------- | ---------------- |
| 1    | Brainstorm    | brainstorming                  | User's idea       | spec.md          |
| 2    | Design        | carfect-design-system          | spec.md           | Design decisions |
| 3    | Plan          | writing-plans                  | spec.md           | plan.md          |
| 4    | Implement     | subagent-driven-development    | plan.md           | Working code     |
| 5    | Test          | (custom rules above)           | spec.md + code    | Test suite       |
| 6    | Simplify      | simplify                       | Tested code       | Lean code        |
| 7    | Bugs+Security | find-bugs + security-review    | Clean code        | Secure code      |
| 8    | Review        | requesting-code-review         | Secure code       | Approved         |
| 9    | Merge         | finishing-a-development-branch | Approved code     | Merged           |
| 10   | Retro         | (memory update)                | Session learnings | MEMORY.md        |

## Red Flags

**Never:**

- Skip brainstorming ("it's simple enough")
- Write tests from implementation code (write from spec)
- Modify failing test to match buggy code
- Skip security review
- Claim completion without running verification
- Merge without all tests passing
- Skip retrospective
