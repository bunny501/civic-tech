# CivicTech Implementation Plan

## Operating principle
Build in two controlled phases. Complete and verify Phase 1 before beginning Phase 2. Do not ask the coding agent to implement both prompts in one run.

## Phase 0 — repository reconnaissance
Acceptance:
- Identify framework, package manager, scripts, existing routes, components, database schema, and deployment config.
- Check Git status and preserve user work.
- Confirm installed versions of map, database, UI, PDF, validation, and AI dependencies.
- Identify existing project/source types to reuse.
- Produce a concise file-change plan before substantial edits.
- Do not replace the repository or reset configuration.

## Phase 1 — core public-works platform
### 1. Shared domain and data
- Define or adapt a single canonical project record.
- Include source provenance and data-origin labels.
- Provide seed/demo records only when clearly labelled.
- Use the existing database path where available.
- Add a reliable fallback if remote persistence is not configured.

### 2. Public Works Intelligence
- Show searchable/filterable projects.
- Filter by status, work type, department, and time window when fields exist.
- Open a useful project detail view.
- Show planned dates, status, location, responsible parties, and source references.
- Show unknown fields honestly.
- Support empty and error states.

### 3. Map experience
- Render projects with valid coordinates.
- Include usable address/place search through the chosen geosearch pattern if compatible.
- Keep map selection and project details connected.
- Make list/map filters consistent.
- Provide a list fallback for projects without coordinates or when the map fails.
- Make the layout responsive.
- Do not imply live traffic or live road closure information.

### 4. Conflict engine
- Build deterministic date-overlap logic.
- Add geographic proximity/overlap logic with documented assumptions.
- Require both temporal and spatial evidence for a conflict classification.
- Distinguish confirmed conflict evidence from candidate/insufficient-data relationships.
- Show the involved projects, date windows, spatial basis, and explanation.
- Unit-test boundary dates, missing data, invalid dates, and non-overlap.

### 5. Delay/timeline analysis
- Compare planned end dates with recorded status and completion dates.
- Preserve update history where feasible.
- Show the basis for overdue/late findings.
- Explain missing updates without accusing any person or department.
- Test completed, ongoing, unknown, and delayed cases.

### Phase 1 acceptance gate
- Directory works end-to-end.
- Project detail and source links work.
- Map renders, markers select projects, and filters affect results.
- Map/geocoder failure does not destroy the directory experience.
- Conflict calculations are deterministic and tested.
- Timeline/delay explanations show their basis.
- Lint/typecheck/tests/build results are reported honestly.
- No nonfunctional primary controls remain.

## Phase 2 — AI notice intelligence and agent
### 1. Notice ingestion
- Accept supported PDFs.
- Extract text with the selected parser.
- Handle scanned/empty/unreadable documents explicitly.
- Retain source metadata and original content/reference.
- Extract fields into a schema and validate with Zod.
- Mark uncertain fields and allow review.
- Do not invent values.

### 2. Notice intelligence
- Generate source-grounded summaries.
- Compare two notice versions and show material changes.
- Translate summaries while preserving source references.
- Distinguish source facts from model interpretation.
- Handle missing API keys, rate limits, provider errors, and malformed output.

### 3. Neighborhood impact
- Resolve an address/place or use a supported location input.
- Find projects using available coordinates/geometries and selected date windows.
- Explain why each project is included.
- Label proximity-based and disruption statements as estimates.
- Do not claim verified traffic/access effects without evidence.
- Keep list output available if map features fail.

### 4. Bounded coordination agent
- Implement narrow read-only tools over the same project model.
- Tools: project search/details, timeline, conflicts, notices, neighborhood works.
- Validate tool arguments and results.
- Limit steps/iterations and result sizes.
- Produce an evidence-backed investigation with facts, calculations, recommendations, and limitations separated.
- Do not allow autonomous record mutation or external actions.

### Phase 2 acceptance gate
- PDF extraction failures are visible and recoverable.
- Extracted fields are schema-validated.
- Every material generated claim points to a source/record or is labelled as inference.
- Agent uses application tools rather than fabricating data.
- Agent terminates on errors and iteration limit.
- Core Phase 1 features still work when the AI provider is unavailable.
- Lint/typecheck/tests/build pass or failures are explicitly documented.

## Final release checklist
- Public deployment is accessible.
- Environment variables are configured safely.
- Demo/seed data is labelled.
- README describes the problem, solution, setup, env variables, libraries/APIs, and limitations.
- Demo video is between 2 and 5 minutes and added to the repository.
- GitHub repository contains the final working code and documentation.
- Test the deployed user journey, not only local development.
- Do not add last-minute dependencies unless required to fix a blocker.
