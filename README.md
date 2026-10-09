# CivicTech: Public Works Intelligence

CivicTech is an autonomous intelligence platform for public works transparency, coordination, and neighborhood impact discovery. It serves as a unified system to manage project schedules, detect physical/temporal coordination conflicts between departments, analyze completion delays, and ingest unstructured civic records (like PDFs) into structured insights using generative AI.

## Main Features

- **Public Works Directory**: Browse, filter, and inspect civic projects by status and work type.
- **Interactive Map**: Geolocation-based discovery of projects using Leaflet and OpenStreetMap.
- **Deterministic Coordination Engine**: Identifies physical proximity and timeline overlaps among projects from different departments, labeling them as potential or verified conflicts.
- **Accountability Timelines**: Analyzes project schedules against actual completion dates to pinpoint delays automatically.
- **AI-Powered Notice Intelligence**: Ingests public notice PDFs, extracts structural records automatically with Zod validation, and preserves an inspectable link to the source document.
- **Bounded Coordination Agent**: A highly controlled, read-only AI agent that investigates works based purely on the tool-provided data (schedules, maps, and facts).

## Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 (incorporating the Hallmark "Editorial" visual system)
- **Map Ecosystem**: `leaflet`, `react-leaflet`, `leaflet-geosearch`
- **Data Validation & Modeling**: `zod`, `date-fns`
- **AI & PDF Processing**: `@google/genai` (Gemini), `unpdf`
- **Testing**: `vitest`

## Setup and Run Commands

1. **Install dependencies**:
   \`\`\`bash
   npm install --legacy-peer-deps
   \`\`\`
   *(Note: `--legacy-peer-deps` is recommended due to peer dependency mismatches between standard Next.js packages and Vitest/Vite)*

2. **Run tests**:
   \`\`\`bash
   npx vitest run
   \`\`\`

3. **Start Development Server**:
   \`\`\`bash
   npm run dev
   \`\`\`

4. **Production Build**:
   \`\`\`bash
   npm run build
   npm run start
   \`\`\`

## Required Environment Variables

For local development and AI capabilities, ensure the following environment variable is set in your `.env.local` file:

- \`GEMINI_API_KEY\`: Valid API key from Google AI Studio. Required for PDF extraction and the Bounded Coordination Agent.
  *(If omitted, the platform degrades gracefully—map, timeline, and conflict engine will continue to function natively.)*

## Demo / Simulated Data

Because a live Supabase connection with PostGIS was not fully configured with production data during Phase 1 & 2, the application operates on a built-in canonical demo dataset (`src/lib/data.ts`). All simulated records are explicitly labeled with `dataOrigin: 'demo'` so they are never misrepresented as live public data.

## Usage Guide

1. **Directory**: Use the left panel to filter the demo dataset by status (e.g., "delayed", "ongoing") or work type.
2. **Details & Evidence**: Click any project to open the right-side detail view. Here you will see its source records, automated delay findings, and identified cross-department coordination conflicts.
3. **Map Discovery**: Use the top-right search bar on the map to fly to an address. Click markers to inspect nearby works.
4. **Agent Investigation**: Switch the left panel to the "Agent Investigation" tab. Ask the agent questions (e.g., "Are there any conflicts involving the water main replacement?").
5. **Ingestion**: Click "Upload Notice" to select a PDF. The AI will extract its properties and surface any uncertain fields for review.

## Remaining Limitations
- Notice extraction parses text efficiently, but scanned image-only PDFs (without OCR text layers) are not supported.
- Spatial conflict logic uses deterministic point-radius thresholds (Haversine distance) rather than actual line-segment overlaps (PostGIS is required for full polygonal tracking). 
