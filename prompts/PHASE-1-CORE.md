# Prompt — Phase 1: CivicTech Core Platform

You are implementing Phase 1 of CivicTech in the existing repository. This is a controlled build task, not permission to redesign the architecture from scratch.

## Read first
Read `AGENTS.md`, `GEMINI.md`, `MEMORY.md`, `ARCHITECTURE.md`, `RULES.md`, `IMPLEMENTATION_PLAN.md`, and `.agents/skills/civictech-implementation/SKILL.md`. Use Hallmark at `.agents/skills/hallmark/SKILL.md` for the UI design workflow.

Inspect the current repository, Git status, `package.json`, routes, database schema, existing UI components, map dependencies, and deployment setup before editing. Preserve existing work and adapt to the code that is actually present.

## Product objective
Implement a working public-works directory and map with project details, deterministic conflict detection, and delay/timeline analysis. Do not implement Phase 2 AI ingestion or the coordination agent in this task.

## Required work
1. Establish or adapt one canonical project record model.
2. Ensure project records can preserve source references and data-origin labels.
3. Use existing persistence where configured; create a small labelled demo dataset only if necessary for a working demonstration.
4. Build the project directory with useful search and filters.
5. Build project detail views with department, contractor, status, date window, location, and source evidence where available.
6. Implement Leaflet map interaction using existing compatible dependencies.
7. Connect markers, filters, selected project, and detail panel.
8. Support address/place search using Leaflet.GeoSearch if compatible; inspect provider requirements and avoid exposing secrets.
9. Add list fallback for missing coordinates, geocoder failure, or map-tile failure.
10. Implement deterministic schedule overlap and geographic proximity/overlap checks in testable domain code.
11. Require temporal and spatial evidence for a conflict classification; distinguish candidate relationships when data is incomplete.
12. Show conflict reasoning, relevant records, dates, and spatial basis.
13. Implement delay/timeline analysis based on actual recorded dates and statuses.
14. Label simulated data and uncertainty clearly.
15. Use Hallmark to establish a distinctive, coherent design appropriate for a public infrastructure intelligence platform. No reference UI is selected.
16. Implement loading, empty, error, and usable states for primary flows.
17. Add tests for date boundaries, missing/invalid dates, spatial threshold logic, and status/delay cases.

## Engineering constraints
- Use TypeScript and existing project conventions.
- Do not add a Python backend, microservices, Kafka, Redis, vector DB, RAG, or multi-agent framework.
- Do not add unnecessary dependencies or replace working configuration wholesale.
- Do not use AI to calculate conflicts or authoritative date results.
- Do not invent live traffic data, public sources, or government updates.
- Do not infer misconduct.
- Do not create fake controls.
- Keep secrets server-side.
- Make the directory usable when AI is unavailable; Phase 1 should not depend on an AI key.

## Acceptance criteria
- A user can browse/search/filter projects and open details.
- The map renders valid project locations and selecting a marker identifies the matching project.
- Map and list filters remain consistent.
- Projects without coordinates remain discoverable.
- A user can see explainable conflict findings based on date and spatial data.
- A user can inspect timeline/delay evidence.
- Unknown and demo fields are labelled honestly.
- Primary flows have useful loading, empty, and error states.
- Tests cover the deterministic domain rules.
- Existing lint/typecheck/test/build scripts are run where available.

## Execution protocol
1. First return a concise repository assessment and implementation plan, naming existing files/components to reuse.
2. Then implement the complete vertical slice; do not stop at a plan unless a blocker requires clarification.
3. After implementation, run the actual available checks.
4. Fix errors introduced by the change.
5. Report changed files, implemented behavior, tests/commands and exact results, environment variables, and known limitations.
6. Explicitly list anything not implemented. Never claim a check passed if it was not run.
