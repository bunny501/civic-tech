# Prompt — Phase 2: Notice Intelligence, Neighborhood Impact, and Agent

Implement Phase 2 only after Phase 1 is working and verified. Extend the existing application; do not replace the data model or rewrite the UI.

## Read first
Read `AGENTS.md`, `GEMINI.md`, `MEMORY.md`, `ARCHITECTURE.md`, `RULES.md`, `IMPLEMENTATION_PLAN.md`, and `.agents/skills/civictech-implementation/SKILL.md`. Inspect the Phase 1 implementation, its tests, source model, database access, map flow, and existing AI SDK version before editing.

Use Hallmark for visual consistency. Do not introduce a separate design system.

## Product objective
Connect public notices and neighborhood lookup to the same canonical project records, then provide a bounded read-only agent that investigates using typed tools and evidence.

## Part A — notice ingestion
1. Accept a supported PDF format and enforce a reasonable size limit.
2. Extract text using the selected `unpdf` integration if compatible with the current setup.
3. Handle encrypted, empty, scanned, malformed, or unsupported documents explicitly.
4. Preserve filename/title, upload/ingestion time, and available source metadata.
5. Ask the model to extract fields against a defined structured schema.
6. Validate the response with Zod before using it.
7. Mark uncertain, missing, or conflicting fields for review.
8. Do not fabricate a department, contractor, budget, location, deadline, URL, or delay reason.
9. Store a source record and link it to a canonical project only when supported.
10. Keep extracted source content distinguishable from a generated summary.

## Part B — notice intelligence
1. Generate a concise source-grounded summary.
2. Show source title/link and which records/fields support material claims.
3. Compare notice versions and display changed fields or text.
4. Provide translation when supported by the configured model.
5. Preserve the source meaning and retain original source access.
6. Mark model interpretations and uncertainty explicitly.
7. Handle missing API key, rate limit, timeout, malformed output, and provider failure.
8. Do not make Phase 1 directory/map/conflict logic depend on AI availability.

## Part C — neighborhood impact intelligence
1. Allow a user to enter/search a supported address or choose a map location.
2. Find relevant project records using available coordinates/geometries and a chosen time window.
3. Explain why each project appears: distance/geometry basis and date overlap.
4. Show upcoming/ongoing works and their source links.
5. Label estimated disruption or access implications as estimates.
6. Do not state that traffic is currently congested or a road is closed unless an actual source supports it.
7. Keep list-based results usable if geocoding or map tiles fail.

## Part D — bounded read-only agent
Implement a controlled tool-calling workflow, not a multi-agent platform.

Suggested tools:
- `searchProjects`
- `getProject`
- `getProjectTimeline`
- `findConflicts`
- `searchNotices`
- `getNeighborhoodWorks`

Requirements:
- Each tool has typed, validated input and output.
- Tool results come from existing application records and deterministic services.
- Use sensible result limits and a strict maximum number of agent steps.
- Tool errors return structured failures and cannot cause an infinite loop.
- Do not expose arbitrary SQL, shell, filesystem, or unrestricted browsing.
- Do not permit direct record mutations or external notifications.
- Return a report with facts, calculated findings, recommendations, sources, and limitations separated.
- Cite record/source IDs or links for material claims.
- If the data cannot answer the question, state what is missing.

## Design and integration
- Reuse the Phase 1 project model and components.
- Use Hallmark for the UI workflow and visual consistency.
- Keep source evidence legible and easy to inspect.
- Ensure uploads, agent outputs, errors, and uncertainty states are usable on desktop and mobile.
- Avoid unnecessary dashboards or decorative visualizations.

## Acceptance criteria
- Supported PDFs extract text or produce a clear failure state.
- Extracted fields are schema-validated.
- Summaries and translations retain source context.
- Notice comparison identifies actual changes rather than merely generating a generic summary.
- Neighborhood results are grounded in available coordinates/geometries and date windows.
- Agent tool calls use typed application functions and terminate safely.
- Reports separate source facts, deterministic calculations, and AI interpretation.
- Core Phase 1 functionality works without an AI API key.
- Tests and existing lint/typecheck/build scripts are run and reported accurately.

## Execution protocol
1. Inspect the current Phase 1 code and report the files/services to extend.
2. Implement the smallest complete vertical slice for each part.
3. Add tests for schema validation, parser failures, tool errors, iteration limits, and evidence mapping.
4. Run actual repository checks and fix introduced failures.
5. Report changed files, behavior, commands/results, environment variables, and known limitations.
6. Do not claim deployment, live data, or source verification that did not occur.
