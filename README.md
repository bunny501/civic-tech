# CivicTech: Public Works Intelligence

CivicTech is an autonomous intelligence platform for public works transparency, coordination, and neighborhood impact discovery. It serves as a unified system to manage project schedules, detect physical/temporal coordination conflicts between departments, analyze completion delays, calculate neighborhood impact radius, and ingest unstructured civic records (like PDFs) into structured insights using generative AI.

## The Six Core Capabilities

1. **Public Works Directory**: Browse, search, filter, and inspect civic projects by status (`planned`, `ongoing`, `delayed`, `completed`) and work type (`road`, `water`, `electrical`).
2. **Deterministic Conflict Detection Engine**: Identifies physical proximity and timeline overlaps among projects from different municipal departments, classifying them into verified schedule conflicts (`repeated_excavation`) or spatial proximity candidates.
3. **Accountability Timelines**: Analyzes project schedules against recorded completion dates to pinpoint delays automatically with neutral, evidence-based explanations.
4. **AI-Powered Notice Intelligence**: Ingests public notice PDFs using `unpdf` and Gemini, extracts structured records validated against a strict Zod schema, surfaces uncertain fields for review in a dedicated interactive modal, and appends accepted records directly to the directory.
5. **Neighborhood Impact Intelligence**: Interactive radius discovery (from 100m to 2000m) that computes physical proximity and potential localized disruptions using the Haversine equation.
6. **Bounded Coordination Agent**: A controlled, read-only AI agent with five typed tools (`searchProjects`, `getProjectDetails`, `getProjectTimeline`, `findConflicts`, `getNeighborhoodWorks`) and a strict iteration limit.

## Technology Stack

- **Framework**: Next.js 16 (App Router with Turbopack)
- **Language**: TypeScript
- **UI & Styling**: React 19, Tailwind CSS v4 (incorporating the Hallmark technical-editorial visual system)
- **Map Ecosystem**: `leaflet`, `react-leaflet`, `leaflet-geosearch`
- **Data Validation & Modeling**: `zod`, `date-fns`
- **AI & PDF Processing**: `@google/genai` (Gemini 3.8 Flash), `unpdf`
- **Testing**: `vitest`

## Setup and Run Commands

1. **Install dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```
   *(Note: `.npmrc` is provided in the repository with `legacy-peer-deps=true` for automated zero-config deployment on Vercel).*

2. **Run test suite**:
   ```bash
   npm test
   # or: npx vitest run
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

4. **Production Build**:
   ```bash
   npm run build
   npm run start
   ```

## Required Environment Variables

For local development and AI capabilities, ensure the following environment variable is set in your `.env.local` file (and in your Vercel Project Settings for production):

- `GEMINI_API_KEY`: Valid API key from Google AI Studio. Required for PDF notice extraction and the Bounded Coordination Agent.
  *(If omitted, the platform degrades gracefully—map, timeline, conflict engine, and neighborhood discovery continue to function natively.)*

## Demo / Simulated Data Grounding

Because a live Supabase connection with PostGIS was not fully configured with production data during initial phases, the application operates on a canonical demo dataset (`src/lib/data.ts`). All simulated records are explicitly labeled with `dataOrigin: 'demo'` or `dataOrigin: 'public'` so they are never misrepresented as live public data.

## Usage Guide

1. **Directory**: Use the left panel to filter records by status (e.g. "delayed", "ongoing") or work type.
2. **Details & Evidence**: Click any project to open the right-side detail view. Here you will see its source records, automated delay findings, and identified cross-department coordination conflicts.
3. **Map Discovery**: Use the search bar on the map to fly to an address. Click markers to inspect nearby works.
4. **Neighborhood Impact**: Switch the left panel to the "Neighborhood" tab. Adjust the radius slider or pick a location to calculate nearby works and distance estimates.
5. **Agent Investigation**: Switch the left panel to the "Agent" tab. Ask the agent questions (e.g. *"Are there any conflicts involving the water main replacement?"*).
6. **Notice Ingestion**: Click "Upload Notice" to select a PDF. The AI will extract its properties, display uncertain fields in the review modal, and allow you to add it directly to the active directory.

## Known Limitations

- Notice extraction parses text efficiently with `unpdf`, but scanned image-only PDFs without OCR text layers are rejected with clear error guidance.
- Spatial conflict logic uses deterministic point-radius thresholds (Haversine distance) rather than polygon intersection geometries.
