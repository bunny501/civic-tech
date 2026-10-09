# Gemini / Antigravity Operating Notes

## Default behavior
- Read `AGENTS.md`, `MEMORY.md`, `ARCHITECTURE.md`, and `RULES.md` before substantive work.
- Read the active prompt in `prompts/` and follow its acceptance criteria.
- Inspect the actual repository before proposing file replacements.
- Use Hallmark for visual-system decisions and the CivicTech implementation skill for product-specific workflow.
- If instructions conflict, preserve data correctness, security, the explicit product brief, and working code over stylistic preference.
- Ask a question only when an unknown blocks safe implementation. Otherwise choose the smallest reversible option and document the assumption.

## Execution discipline
- Plan briefly, then implement a complete vertical slice.
- Avoid large speculative refactors.
- Avoid creating a second copy of a model, service, hook, or component that already exists.
- Do not generate mock data in production service paths unless the environment explicitly enables demo mode.
- Use realistic seed data only where clearly labelled.
- Keep map, list, detail, and timeline views connected to the same source of truth.
- Keep all secrets on the server.
- Validate model output at runtime.
- Use deterministic functions for date and spatial conflict logic.
- Add clear fallback behavior when geocoding, map tiles, database access, or AI providers fail.

## Design execution
- Invoke Hallmark's documented workflow before building or revising major screens.
- Do not assume a reference screenshot exists; none has been selected.
- Define a CivicTech visual direction based on public infrastructure intelligence, evidence, location, and time.
- Avoid generic dashboard clichés, gratuitous gradients, oversized hero sections, meaningless KPI cards, and fake charts.
- Give maps, schedules, evidence, and conflicts enough visual space to be legible.
- Use consistent typography, spacing, borders, status semantics, and interaction states.
- Build reusable components only when at least two real screens need them or a clear domain abstraction exists.
- Make every interactive affordance functional.

## Validation and reporting
- Run the repository's existing scripts rather than guessing their names.
- Report changed files, user-visible behavior, database changes, environment variables, and commands run.
- Distinguish passed checks from skipped checks and known limitations.
- Do not claim deployment success unless a deployment URL or provider confirmation exists.
- Do not claim real-time data unless the source is genuinely live.
