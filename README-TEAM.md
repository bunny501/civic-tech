# CivicTech — Team Reference

## One-line pitch
CivicTech connects public-works records, notices, schedules, and geography so residents can understand nearby disruption and public teams can spot potential work conflicts with traceable evidence.

## Problem
Public-works information is scattered across notices, departments, contractors, and informal updates. Residents struggle to learn what is happening, who is responsible, and when work may finish. Departments may plan overlapping work on the same road, causing repeat excavation and avoidable disruption.

## Six capabilities
1. Public Works Intelligence directory.
2. Cross-Department Conflict Detection.
3. Delay and Accountability Analysis.
4. AI-Powered Notice Intelligence.
5. Neighborhood Impact Intelligence.
6. Read-only AI Coordination and Impact Agent.

## Differentiator
The product connects source notices to structured records, geographic context, deterministic schedule/location checks, timelines, and explanations for different audiences. It is not just a chatbot.

## Technology direction
- Next.js App Router + TypeScript.
- Supabase PostgreSQL; PostGIS only if available and justified.
- Leaflet + React-Leaflet + Leaflet.GeoSearch where compatible.
- Tailwind CSS and the UI components already in the repository.
- `unpdf` for suitable PDF text extraction.
- Zod for runtime validation.
- Gemini via a server-side SDK integration.
- Public deployment, likely Vercel if compatible.

Check actual installed versions and current project setup before changing dependencies.

## Data integrity promise
- Clearly label simulated/demo records.
- Separate source facts, deterministic findings, and AI estimates.
- Preserve source metadata.
- Do not claim live traffic or verified road-access impacts without data.
- Do not infer misconduct from missing updates or delayed work.

## Development sequence
- Phase 1: shared project model, directory, map, deterministic conflicts, timelines.
- Phase 2: notice extraction/summaries, neighborhood impact, bounded read-only agent.

## Required submission material
- Public deployment URL.
- GitHub repository.
- README with problem, solution, setup, environment variables, and API/library disclosure.
- A 2–5 minute demo video in the repository.
- Honest description of simulated data and known limitations.

## Suggested demo story
1. Search for a road/neighborhood.
2. Open a nearby project and inspect source details.
3. Select a date window and see another work item overlapping in time and space.
4. Open the conflict explanation and verify the evidence.
5. Open a public notice and view extracted fields with uncertainty/source attribution.
6. Ask the bounded agent to investigate the situation and inspect its evidence.
7. End by showing the deployment and README.

Do not demonstrate a feature unless it is functional in the deployed build.
