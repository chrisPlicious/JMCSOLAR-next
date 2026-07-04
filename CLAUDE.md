## Session Start: Recall Memory FIRST

**IMPORTANT: At the start of every session, BEFORE doing any work, search
claude-mem's persistent memory to load full context** — what was accomplished,
what was fixed, and what's next. Invoke the `/claude-mem:mem-search` skill (the
`mem-search` skill) to retrieve prior-session work. Do this before exploring the
codebase or asking the user for context they may have already given in a past session.

- Use it to answer "did we already solve this?", "how did we do X last time?",
  and "what was I supposed to do next?".
- Pair it with the recent-context summary injected at session start; if that
  summary is missing or thin, run `mem-search` to backfill.

---

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
|------|----------|
| `detect_changes` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context` | Need source snippets for review — token-efficient |
| `get_impact_radius` | Understanding blast radius of a change |
| `get_affected_flows` | Finding which execution paths are impacted |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes` | Finding functions/classes by name or keyword |
| `get_architecture_overview` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.

---

## Feature Development Workflow (multi-agent)

When building a planned feature (e.g. from `.claude/plans/*.md`), the main session
**orchestrates** the agents in `.claude/agents/`. Plans are built **one phase at a
time** (not big-bang). Follow this loop unless the user says otherwise.

### Per phase

1. **Read the plan.** Load the plan file; pick the lowest unfinished phase.
2. **Gain context with context-mode.** Use the context-mode MCP
   (`ctx_batch_execute` / `ctx_search`) to gather the codebase context that phase
   needs *before* delegating. (code-review-graph MCP tools are also fine for structure.)
3. **Implement → then test (SEQUENTIAL — never parallel):**
   - Call **plan-implementer** for the phase. It writes the code and self-verifies
     (`typecheck`, `lint`, `test`).
   - **Only after it finishes**, call **test-writer**. It writes (a) vitest
     unit/integration tests against the now-finished code, and (b) a **manual-test
     checklist doc for the human** (e.g. `docs/manual-tests/<phase>.md`).
     test-writer does **not** write Playwright E2E.
4. **QA the slice.** After both agents are done, call **qa-playwright** to author +
   run the Playwright E2E for the flow. Run the **full E2E at milestones** (after the
   checkout phase, after the admin phase); smaller slices may need only unit + manual.
5. **On QA errors → debugger.** If qa-playwright reports failures, call **debugger**
   to root-cause and fix, then re-run qa-playwright. Loop until green.
6. **Green → report to the human.** When QA passes, tell the user the phase is done
   and hand them the manual-test checklist so they can run their own manual test.
7. Repeat for the next phase.

### After all phases are done AND the human's manual test passed

- Call **handoff-doc-writer** to produce the handoff doc (what was done, current
  state, next steps, gotchas).

### On demand

- If the user says **"review the code"**, call **code-reviewer** (zero-context,
  read-only review of structure + strength).

### Rules

- **Sequence implement → test.** Never run plan-implementer and test-writer in
  parallel — tests would target unbuilt code and the two agents would collide on file
  edits.
- **Gates must be green** (`npm run typecheck && npm run lint && npm run test`) before
  moving a phase to QA.
- **Test ownership split:** test-writer owns vitest units + the human manual
  checklist; qa-playwright owns the automated Playwright E2E. Keep that split.
- Money is **centavos**; reuse existing utilities (`lib/payments`, `adminDb`,
  `requireAdminAuth`, `formatCentavos`); do **not** touch the audited booking flow
  unless the plan says so.
