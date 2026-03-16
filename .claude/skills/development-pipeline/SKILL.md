---
name: development-pipeline
description: 'Multi-agent development pipeline for feature implementation. Use when building new features, major changes, or multi-file modifications. Orchestrates 10 steps from brainstorm to merge with retrospective.'
---

# Multi-Agent Development Pipeline

Orchestrate feature development through 10 sequential steps using specialized subagents. Each step dispatches a dedicated agent via the `Agent` tool. No step can be skipped.

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
1. Brainstorm      → spec.md              Agent: brainstormer
2. System Design   → design decisions     Agent: system-designer
3. Plan            → plan.md              Agent: planner
4. Implement       → working code         Agent: implementer (per task)
5. Test            → test suite           Agent: tester
6. Simplify        → lean code            Agent: simplifier
7. Bugs + Security → issues fixed         Agents: bug-finder + security-auditor (parallel)
8. Review          → approved             Agent: reviewer
9. Merge           → PR or merged         Agent: merger
10. Retrospective  → MEMORY.md updated    Agent: retrospective
```

## How to Orchestrate

You (the main agent) are the orchestrator. For each step:

1. Dispatch the subagent via `Agent` tool with `subagent_type` matching the agent name
2. Pass relevant context in the prompt (spec content, task text, file paths)
3. Read the subagent's result
4. Check the gate condition
5. If gate passes → proceed to next step
6. If gate fails → re-dispatch or send back to earlier step

### Dispatch Examples

```
# Step 1
Agent(subagent_type="brainstormer", prompt="User wants to build: [idea]. Start brainstorming.")

# Step 2
Agent(subagent_type="system-designer", prompt="Spec approved. Read spec.md and verify design decisions.")

# Step 3
Agent(subagent_type="planner", prompt="Spec + design decisions approved. Read spec.md and create plan.md.")

# Step 4 (per task from plan.md)
Agent(subagent_type="implementer", prompt="Execute task 1: [full task text from plan.md]")
Agent(subagent_type="implementer", prompt="Execute task 2: [full task text from plan.md]")

# Step 5
Agent(subagent_type="tester", prompt="Implementation complete. Read spec.md and write tests for all requirements.")

# Step 6
Agent(subagent_type="simplifier", prompt="Tests passing. Review all changed files for simplification.")

# Step 7 (parallel)
Agent(subagent_type="bug-finder", prompt="Review all changes for bugs.")
Agent(subagent_type="security-auditor", prompt="Review all changes for security vulnerabilities.")

# Step 8
Agent(subagent_type="reviewer", prompt="All fixes applied. Final review against spec.md.")

# Step 9
Agent(subagent_type="merger", prompt="Review approved. Run final tests and present merge options.")

# Step 10
Agent(subagent_type="retrospective", prompt="Feature merged. Run retrospective with user.")
```

## Step Details

### Step 1: Brainstorm → `brainstormer`

Turn idea into `spec.md`. One question at a time. Multiple choice preferred.
**Gate:** User approves spec.

### Step 2: System Design → `system-designer`

Verify design decisions against project conventions (component placement, shared libs, UI patterns).
**Gate:** Design decisions appended to spec, user confirms.

### Step 3: Plan → `planner`

Break spec into atomic tasks with exact file paths, code snippets, verification commands.
**Gate:** User approves plan.md.

### Step 4: Implement → `implementer` (one per task)

Execute tasks sequentially. Backend first, then frontend.
Each task: implement → verify → commit.
**Gate:** All tasks complete, all tests passing.

### Step 5: Test → `tester`

<HARD-RULE>
Tests are written from spec.md, NOT from implementation code.
If a test fails, the IMPLEMENTATION is wrong — not the test.
Tester NEVER modifies failing test assertions to match buggy code.
Failures are reported back to implementer for fixing.
</HARD-RULE>

**Gate:** All tests passing.

### Step 6: Simplify → `simplifier`

Remove dead code, DRY up duplicates, improve naming/readability. Never add features.
**Gate:** All tests still passing.

### Step 7: Bugs + Security → `bug-finder` + `security-auditor` (parallel)

Dispatch both agents simultaneously. Bug finder hunts logic errors, security auditor checks OWASP.
**Gate:** Zero Critical/High issues.

### Step 8: Review → `reviewer`

Spec compliance + code quality. APPROVED or CHANGES REQUESTED with routing.
**Gate:** APPROVED status.

### Step 9: Merge → `merger`

Final test run, build verification, present merge options, cleanup.
**Gate:** Tests + build pass with evidence.

### Step 10: Retrospective → `retrospective`

Ask user what went well/badly. Update MEMORY.md with lessons learned.

## Feedback Loops

**Local loop (Steps 7-8 → Step 4):**
Bug/security/review issue → re-dispatch `implementer` with fix instructions. Spec unchanged.

**Full loop (Step 8 → Step 1):**
Spec itself is wrong → re-dispatch `brainstormer`. Rare but critical.

## Agent Reference

| Step | Agent            | Subagent Type      | Input          | Output           |
| ---- | ---------------- | ------------------ | -------------- | ---------------- |
| 1    | Brainstormer     | `brainstormer`     | User's idea    | spec.md          |
| 2    | System Designer  | `system-designer`  | spec.md        | Design decisions |
| 3    | Planner          | `planner`          | spec.md        | plan.md          |
| 4    | Implementer      | `implementer`      | task from plan | Working code     |
| 5    | Tester           | `tester`           | spec.md + code | Test suite       |
| 6    | Simplifier       | `simplifier`       | Tested code    | Lean code        |
| 7a   | Bug Finder       | `bug-finder`       | Clean code     | Bug fixes        |
| 7b   | Security Auditor | `security-auditor` | Clean code     | Secure code      |
| 8    | Reviewer         | `reviewer`         | Secure code    | Approved         |
| 9    | Merger           | `merger`           | Approved code  | Merged           |
| 10   | Retrospective    | `retrospective`    | Session        | MEMORY.md        |

## Red Flags

**Never:**

- Skip brainstorming ("it's simple enough")
- Write tests from implementation code (write from spec)
- Modify failing test to match buggy code
- Skip security review
- Claim completion without running verification
- Merge without all tests passing
- Skip retrospective
