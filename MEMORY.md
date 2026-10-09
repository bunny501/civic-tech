# CivicTech — Authoritative Project Memory

## Product identity
CivicTech is a public infrastructure intelligence platform for transparency and coordination in municipal/public-works projects. It connects project records, public notices, geography, schedule windows, conflict findings, and audience-specific explanations.

It is not primarily:
- A citizen complaint portal.
- A generic CRUD dashboard.
- A chatbot with a few unrelated API calls.
- A traffic prediction system without traffic data.
- A multi-agent research framework for its own sake.

## Problem
Public works are distributed across departments and contractors. Residents may not know what work is happening, who is responsible, or when it will finish. Departments may not know that other work is planned on the same road. Repeated excavation, unexplained delays, and missing source context create disruption and reduce trust.

## Primary users
- Residents and businesses: understand nearby works, schedule windows, and source-backed updates.
- Contractors: identify schedule clashes, repeated work, and dependencies requiring coordination.
- Government departments: inspect project status, evidence, and possible coordination issues.

## Six locked capabilities
1. Public Works Intelligence directory.
2. Cross-Department Conflict Detection.
3. Delay and Accountability Analysis.
4. AI-Powered Notice Intelligence.
5. Neighborhood Impact Intelligence.
6. AI Coordination and Impact Agent.

These six capabilities define the product direction. The implementation can stage them, but should not silently replace them with unrelated features.

## Product truth rules
- A confirmed source fact must have a traceable source record.
- A computed finding must identify the rule/data used to calculate it.
- An AI estimate must be explicitly labelled as an estimate or interpretation.
- A simulated record must be visibly labelled as demo/simulated data.
- Missing evidence is not evidence of wrongdoing.
- An absent explanation means no explanation was found in available records; it does not prove misconduct.
- Do not claim verified traffic, road access, or safety impact without a supporting source.
- Never invent a citation, source URL, authority action, or live status.

## Architecture decisions
- Use a single web application and one consistent project-record model.
- Frontend: Next.js App Router, TypeScript, React, Tailwind CSS, and the UI primitives already present or deliberately selected.
- Persistence: Supabase PostgreSQL; use PostGIS only if it is available and useful for real spatial queries. Do not assume the extension is enabled without checking.
- Mapping: Leaflet + React-Leaflet, with Leaflet.GeoSearch if compatible with the installed setup.
- Document parsing: `unpdf` where suitable for PDF text extraction.
- Validation: Zod or the existing schema-validation approach.
- AI: Gemini through the server-side integration already chosen/installed; inspect the actual SDK before writing provider code.
- Hosting: public web deployment, likely Vercel if compatible with the repository.
- Do not introduce a separate Python backend, microservices, Redis, Kafka, a vector database, or a multi-agent framework for this 24-hour project without a specific demonstrated need.

## Reference implementation map
The project brief names these references as pattern sources, not products to merge wholesale:
- Civic Brief: document-to-structured-record flow, source-linked claims, verification, translation.
- Flood Watch: map interaction, geospatial layers, geographic visualization.
- Farol: staged document processing, analysis separation, rule-based anomaly signals.
- TenderLens: explainable alerts, investigation queue, relationship/context views.
- Leaflet.GeoSearch: address/place search patterns compatible with the chosen map stack.
- LangGraph JS: conditional tool workflow patterns only if the bounded agent genuinely needs them.

Inspect current READMEs, relevant folders, setup steps, licenses where required by the team, and test behavior before reusing code. Reuse focused patterns and testable functions. Do not import an entire product or its unrelated assumptions.

## Implementation order
Phase 1:
- Project data model and seeded/demo data path.
- Project directory, filtering, details, and source references.
- Map, markers, location search, list/map coordination, and useful fallback states.
- Deterministic schedule/location conflict detection.
- Delay/timeline view based on recorded dates and updates.
- Basic tests for conflict and date rules.

Phase 2:
- Notice upload/ingestion and structured extraction.
- Source-linked summary, comparison, and translation.
- Neighborhood impact view using existing records and clearly labelled estimates.
- Bounded read-only investigation agent using narrow tools.
- AI error handling and end-to-end verification.

## Hackathon acceptance priorities
- Publicly accessible deployment.
- Main journey works without setup.
- Clear README with problem, solution, setup, environment variables, and API/library disclosures.
- 2–5 minute demo video stored or linked in the repository as required.
- No fake/nonworking demo behavior.
- Reliable error states and honest data labels.
- Tests and build checks reported accurately.

## Current workflow
- Use Hallmark as the selected UI design skill.
- No reference UI screenshot or URL is selected; design should be derived from product workflows.
- Keep the project-specific `civictech-implementation` skill.
- Remove overlapping `design-taste-frontend` and `redesign-existing-projects` skills only after verifying their folders and updating the skills lockfile if needed.
- Do not replace the existing repository wholesale. Apply instruction updates selectively and preserve application source/configuration.
