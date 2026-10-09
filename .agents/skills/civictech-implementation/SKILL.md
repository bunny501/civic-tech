# CivicTech Implementation Skill

## Purpose
Apply the project's product rules and implementation workflow to feature work. This skill complements `AGENTS.md`; it does not override the product brief or existing code.

## When to use
- Adding or modifying public-works project data.
- Building directory, map, timeline, conflict, notice, neighborhood, or agent features.
- Integrating document parsing or an AI provider.
- Debugging map, schedule, source, or evidence behavior.
- Preparing the public demo or submission.

## Workflow
1. Read `MEMORY.md`, `ARCHITECTURE.md`, `RULES.md`, and the active phase prompt.
2. Inspect the repository and Git status.
3. Locate the current model, data access, validation, components, tests, and scripts.
4. Identify the smallest end-to-end behavior to implement.
5. Write down assumptions that affect data correctness.
6. Implement domain logic before visual wiring when calculations are involved.
7. Connect UI components to real application state/data.
8. Add tests for deterministic rules and malformed input.
9. Run the available quality checks.
10. Report exact outcomes and limitations.

## Domain invariants
- One canonical project model is shared by all features.
- Every project may have incomplete fields; missing data must remain missing.
- Source facts require source provenance.
- Demo records must be labelled.
- Deterministic rules produce conflict and delay calculations.
- AI summarizes, extracts, translates, and explains; it is not the authority for calculated facts.
- A conflict requires temporal and spatial evidence or must be labelled as a candidate.
- A late project does not automatically imply misconduct.
- A missing explanation is a transparency gap, not proof of wrongdoing.
- Estimated impact must be labelled as estimated.

## Map-specific checklist
- Confirm coordinate ordering and validation.
- Reuse the selected Leaflet stack where compatible.
- Avoid repeated geocoding requests during render.
- Keep selected marker and selected project synchronized.
- Keep list/map filters aligned.
- Provide an alternative when coordinates or map services are unavailable.
- Use proper distance calculations and document thresholds.
- Do not represent a point-proximity heuristic as proof of shared excavation.
- Test missing coordinates, no results, failed geocoder, and map tile failure.

## Conflict-specific checklist
- Define interval inclusivity.
- Test same-day overlap.
- Test adjacent but non-overlapping intervals.
- Test missing/invalid start or end.
- Test completed and ongoing status.
- Require spatial evidence.
- Include involved record IDs and explanatory reason.
- Surface uncertainty when only approximate coordinates are available.
- Make results reproducible from the same input records.

## Notice-specific checklist
- Keep original file/source metadata.
- Handle empty or unreadable PDF text.
- Validate model output.
- Track uncertain fields.
- Never invent a citation or source URL.
- Keep original source available next to the summary.
- Compare actual field/text differences between versions.
- Handle missing model configuration without breaking core features.

## Agent-specific checklist
- Tools are narrow, typed, and read-only.
- Validate tool arguments.
- Limit output size and step count.
- Handle tool failure as a recoverable structured result.
- Do not grant arbitrary SQL, shell, filesystem, or unrestricted network access.
- Include evidence used in the report.
- Separate facts, calculations, estimates, and recommendations.
- Do not claim an external action occurred.

## UI workflow
- Invoke Hallmark's documented workflow before major UI implementation.
- Derive screens from the product's real tasks; no reference UI has been selected.
- Keep visual design coherent across map, list, detail, timeline, notice, and agent views.
- Use consistent spacing, typography, status color, borders, and interaction patterns.
- Avoid generic template output and decorative fake metrics.
- Ensure controls work and provide accessible focus/keyboard behavior.
- Include loading, empty, error, and successful states.
- Check responsive layouts and map usability.

## Done means
- Acceptance criteria are met in the running application.
- Relevant tests exist and were executed where possible.
- Typecheck/lint/build outcomes are recorded accurately.
- No fake data is presented as live.
- README/environment setup is updated if needed.
- Known limitations are explicit.
