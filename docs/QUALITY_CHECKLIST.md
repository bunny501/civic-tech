# Quality Checklist — CivicTech

## Before coding
- [ ] Read persistent instructions and active phase prompt.
- [ ] Check Git status and preserve uncommitted work.
- [ ] Inspect package scripts and installed versions.
- [ ] Identify existing models/services/components to reuse.
- [ ] Confirm feature belongs to the six-capability scope.
- [ ] Identify source-of-truth data and uncertainty rules.
- [ ] Use Hallmark before substantial UI work.

## Public works directory
- [ ] Search returns relevant records.
- [ ] Filters affect both result list and map where applicable.
- [ ] Project detail shows available department, contractor, status, dates, and location.
- [ ] Unknown fields are not fabricated.
- [ ] Source links or source titles are visible.
- [ ] Empty/error/loading states are usable.

## Map
- [ ] Coordinates validated.
- [ ] Markers correspond to project IDs.
- [ ] Selecting a marker opens the matching project.
- [ ] Missing coordinates do not hide the project from the directory.
- [ ] Geocoder failures are handled.
- [ ] Tile failures preserve a useful fallback.
- [ ] No unsupported live traffic or closure claims.
- [ ] Mobile layout remains usable.

## Conflicts
- [ ] Date interval convention documented.
- [ ] Same-day boundary tested.
- [ ] Non-overlapping windows tested.
- [ ] Missing/invalid dates tested.
- [ ] Geographic threshold uses appropriate units.
- [ ] Spatial uncertainty is visible.
- [ ] Findings include projects, date windows, spatial basis, and reason.
- [ ] No AI-generated arithmetic is treated as authoritative.

## Delay and accountability
- [ ] Planned dates are distinguished from actual dates.
- [ ] Completed and ongoing cases are tested.
- [ ] Missing explanations are described neutrally.
- [ ] No unsupported accusation is made.
- [ ] Timeline entries retain source/effective date where known.

## Notice intelligence
- [ ] Supported file type and size limit enforced.
- [ ] Empty/unreadable PDF produces a clear error.
- [ ] Extracted fields are validated.
- [ ] Uncertain fields are marked.
- [ ] Original source remains accessible.
- [ ] Summary claims have evidence.
- [ ] Comparison shows real differences.
- [ ] Translation does not replace the original.
- [ ] Missing key/provider failure is handled.

## Agent
- [ ] Tools are read-only and narrowly scoped.
- [ ] Inputs and outputs are validated.
- [ ] Result count and step count are bounded.
- [ ] Tool errors cannot create infinite loops.
- [ ] Report cites the records consulted.
- [ ] Facts, calculations, estimates, and recommendations are separated.
- [ ] Insufficient data is acknowledged.
- [ ] No unperformed external action is claimed.

## Release
- [ ] Existing lint script run.
- [ ] Existing typecheck script run if present.
- [ ] Existing tests run.
- [ ] Production build run.
- [ ] Environment variables documented.
- [ ] No secrets committed.
- [ ] Public deployment tested.
- [ ] Demo records labelled.
- [ ] README updated.
- [ ] API/library disclosures included.
- [ ] 2–5 minute demo video added to repository.
- [ ] Known limitations are stated honestly.
