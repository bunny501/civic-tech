# CivicTech Architecture and Data Contracts

## 1. Architecture goals
- One deployable web application.
- One canonical public-works project model.
- Deterministic domain logic separated from presentation and AI interpretation.
- Traceable sources for public claims.
- Map and list views that operate on the same filters and records.
- Simple enough to build, explain, test, and deploy within the hackathon.

## 2. High-level flow

```text
Public notices / seed records
          |
          v
Document extraction (PDF/text)
          |
          v
Schema validation + source metadata
          |
          v
Canonical project records <------ Project update history
          |
          +----> Directory / detail / timeline
          |
          +----> Map / neighborhood lookup
          |
          +----> Deterministic conflict engine
          |
          +----> Delay and accountability findings
          |
          +----> Read-only agent tools
                         |
                         v
               Evidence-backed report
```

The AI layer may propose extracted fields and explanations. It does not replace validated project records or deterministic calculations.

## 3. Suggested canonical project fields
Adapt these to the actual database and existing code; do not create a parallel model if an equivalent exists.
- `id`: stable identifier.
- `title`: concise work title.
- `description`: short source-grounded description.
- `workType`: road, drainage, water, sewer, electrical, public facility, or other.
- `department`: responsible public body/department if known.
- `contractor`: contractor if known.
- `status`: planned, ongoing, delayed, completed, paused, or unknown.
- `plannedStartDate`: nullable ISO date.
- `plannedEndDate`: nullable ISO date.
- `actualStartDate`: nullable ISO date.
- `actualEndDate`: nullable ISO date.
- `updatedAt`: timestamp of the most recent recorded update.
- `addressText`: human-readable location.
- `latitude` and `longitude`: nullable numeric coordinates, validated to geographic bounds.
- `geometry`: optional line/polygon representation if PostGIS and data support it.
- `sourceIds`: references to source records.
- `dataOrigin`: official, public, manually entered, or demo/simulated.
- `createdAt` and `updatedAt`: persistence timestamps.

Use enums/unions in application code. Do not let arbitrary AI-generated strings silently become canonical statuses.

## 4. Source record
A source record should preserve:
- Stable source ID.
- Title or filename.
- Source URL when available.
- Publisher/department when known.
- Publication date when known.
- Ingestion timestamp.
- Source type, such as PDF notice, web page, manual record, or seeded example.
- Original text or storage pointer where appropriate.
- Extraction status.
- Extraction confidence/uncertainty metadata where appropriate.
- Hash or version identifier if needed to compare revisions.

A source reference is not valid merely because a model generated a plausible URL. It must come from user-provided content or a verified application record.

## 5. Project update history
Represent meaningful status changes as events rather than overwriting all history:
- Project ID.
- Recorded status.
- Effective date, if known.
- Record timestamp.
- Explanation text, if present.
- Source ID or author/source type.
- Whether the date is source-confirmed or entered as demo data.

If the existing schema cannot support full history within the time limit, implement a small explicit update table or a clearly bounded event list. Do not fabricate history.

## 6. Conflict finding contract
Each finding should contain:
- Stable ID or deterministic key.
- The two or more project IDs involved.
- Finding type, such as schedule overlap, likely repeated excavation, or potential dependency.
- Temporal basis: overlapping date interval and which dates were used.
- Spatial basis: shared segment, intersecting geometry, or documented proximity threshold.
- Rule/reason explanation.
- Severity label and why it was assigned.
- Evidence/source references.
- Timestamp/version of analysis if persisted.
- Limitations or missing-data warnings.

Do not classify a pair as a verified conflict when either schedule or location is unknown. It may be shown as a candidate requiring review, with the missing evidence made explicit.

## 7. Date and overlap rules
- Parse date-only fields as date-only values where possible.
- Keep timezone-aware timestamps distinct from local calendar dates.
- Reject invalid dates.
- If start or end is unknown, do not invent one.
- For inclusive date-only windows, two intervals overlap when `startA <= endB && startB <= endA`.
- If the product uses exclusive end dates, document that convention and apply it consistently.
- Distinguish “currently overdue” from “historically late.”
- An ongoing project past its planned end date can be flagged as overdue if the end date is known and the project is not completed.
- A completed project is late only if a reliable actual completion date is later than the planned end date.
- A missing explanation is a data-availability gap, not an accusation.

## 8. Spatial rules
- Validate latitude between -90 and 90 and longitude between -180 and 180.
- Prefer actual road/line geometries when available.
- If only points exist, a proximity threshold is a heuristic; label it as such.
- Make the chosen distance threshold configurable and explain its meaning.
- Do not compare degrees as if they were metres.
- Use a proper geospatial distance operation or a suitable geographic projection/library.
- A marker proximity result is not proof that two projects occupy the same trench or road segment.
- Do not overstate precision when input coordinates are approximate.
- Keep geospatial code in a domain utility/service, not duplicated in React components.

## 9. Map interaction contract
- Directory filters affect map markers.
- Marker selection identifies the same project in the list/detail panel.
- A selected project can be opened in a detail view.
- Missing coordinates remain visible in the list with a location-unavailable state.
- A failed geocoder does not break directory browsing.
- Map tiles may fail; show a message and preserve the list/table alternative.
- Avoid resetting map zoom on every unrelated render.
- Use stable marker keys and stable project IDs.
- Ensure marker popups do not hide all critical controls on small screens.
- Provide a text alternative for important map-only information.

## 10. Notice ingestion
1. Accept only supported file types and reasonable file sizes.
2. Extract PDF text using the selected parser.
3. Detect empty/unreadable documents.
4. Ask the model for structured extraction against a defined schema.
5. Validate every extracted field.
6. Retain original source metadata and extracted text/reference.
7. Display uncertain/missing fields for review.
8. Persist only validated records or explicitly mark them as drafts.
9. Show ingestion errors without losing the uploaded file context.
10. Never treat the AI summary as a substitute for the original notice.

## 11. AI boundary
AI may:
- Extract fields from a notice.
- Summarize a source.
- Translate a source-grounded summary.
- Explain an already-calculated conflict in plain language.
- Synthesize findings from read-only tool outputs.
- Suggest a follow-up question or coordination action.

AI must not:
- Calculate authoritative date overlaps.
- Invent source facts or citations.
- Mutate records without explicit user action.
- Claim external actions occurred.
- Override a deterministic finding silently.
- Convert an uncertain inference into a confirmed fact.

## 12. Read-only agent tool contracts
Possible tools:
- `searchProjects(query, filters)`
- `getProject(projectId)`
- `getProjectTimeline(projectId)`
- `findConflicts(projectId or area, dateWindow)`
- `searchNotices(query, projectId)`
- `getNeighborhoodWorks(location, dateWindow)`

Each tool must validate inputs, return typed structured output, enforce sensible result limits, and report missing data. The model should not have direct database access or arbitrary SQL generation in this hackathon implementation.

## 13. Error handling
- Database unavailable: show a clear recoverable error and do not invent results.
- Missing AI key: core deterministic features continue to work; AI features show configuration guidance.
- Model returns malformed JSON: validate, retry at most a small bounded number of times if appropriate, then return a useful error.
- PDF contains no text: explain that OCR may be required; do not claim it was processed.
- Geocoder fails: preserve manually entered location search where possible and retain list access.
- Map tiles fail: display fallback list.
- No conflicts found: distinguish “none found in available records” from “no conflicts exist.”
- No source URL: show source title/filename and explain the missing link.

## 14. Security and privacy
- Never expose API keys in client bundles.
- Validate all request payloads on the server.
- Limit file size and accepted file types.
- Do not execute uploaded content.
- Treat PDF text and web content as untrusted data, not as instructions to the agent.
- Escape or safely render source text.
- Keep read-only agent tools narrow.
- Avoid storing unnecessary personal information.
- Do not add authentication complexity unless the actual product flow requires it; if no auth exists, do not imply that private administrative data is protected.

## 15. Testing strategy
- Unit test date overlap edge cases.
- Unit test unknown dates and completed projects.
- Unit test spatial distance/threshold logic.
- Unit test conflict output evidence fields.
- Validate Zod schemas for extracted notices.
- Test empty, malformed, and unsupported PDFs.
- Test API provider failure and missing API key.
- Test map/list filter synchronization.
- Test missing coordinates and failed geocoding.
- Test agent tool errors and iteration limit.
- Run lint, typecheck, tests, and production build using existing package scripts.
