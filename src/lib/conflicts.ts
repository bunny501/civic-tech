import { Project, ConflictFinding } from './types';
import { parseISO, isBefore, isEqual } from 'date-fns';
import { getDistance } from './neighborhood';

function checkDateOverlap(
  startA: Date | null,
  endA: Date | null,
  startB: Date | null,
  endB: Date | null
): boolean {
  if (!startA || !endA || !startB || !endB) return false;
  // Two inclusive intervals overlap if startA <= endB && startB <= endA
  return (
    (isBefore(startA, endB) || isEqual(startA, endB)) &&
    (isBefore(startB, endA) || isEqual(startB, endA))
  );
}

export function detectConflicts(projects: Project[]): ConflictFinding[] {
  const conflicts: ConflictFinding[] = [];
  const PROXIMITY_THRESHOLD_METERS = 200;

  for (let i = 0; i < projects.length; i++) {
    for (let j = i + 1; j < projects.length; j++) {
      const p1 = projects[i];
      const p2 = projects[j];

      // Needs coordinates to check spatial
      if (p1.latitude === null || p1.longitude === null || p2.latitude === null || p2.longitude === null) {
        continue;
      }

      const distance = getDistance(p1.latitude, p1.longitude, p2.latitude, p2.longitude);
      const isSpatialConflict = distance <= PROXIMITY_THRESHOLD_METERS;

      const dateStart1 = p1.actualStartDate ? parseISO(p1.actualStartDate) : (p1.plannedStartDate ? parseISO(p1.plannedStartDate) : null);
      const dateEnd1 = p1.actualEndDate ? parseISO(p1.actualEndDate) : (p1.plannedEndDate ? parseISO(p1.plannedEndDate) : null);
      const dateStart2 = p2.actualStartDate ? parseISO(p2.actualStartDate) : (p2.plannedStartDate ? parseISO(p2.plannedStartDate) : null);
      const dateEnd2 = p2.actualEndDate ? parseISO(p2.actualEndDate) : (p2.plannedEndDate ? parseISO(p2.plannedEndDate) : null);

      const isTemporalConflict = checkDateOverlap(dateStart1, dateEnd1, dateStart2, dateEnd2);

      if (isSpatialConflict && isTemporalConflict) {
        conflicts.push({
          id: `conflict-${p1.id}-${p2.id}`,
          projectIds: [p1.id, p2.id],
          type: 'repeated_excavation', // Could refine based on workType
          temporalBasis: `Projects overlap in schedule between ${dateStart1?.toISOString().split('T')[0]} and ${dateEnd2?.toISOString().split('T')[0]} (approximate).`,
          spatialBasis: `Projects are approximately ${Math.round(distance)}m apart.`,
          reason: `Both ${p1.department} and ${p2.department} have work planned in the same timeframe and vicinity.`,
          severity: 'high',
          evidence: [...p1.sourceIds, ...p2.sourceIds],
        });
      } else if (isSpatialConflict) {
        // Candidate relationship based only on space
        conflicts.push({
          id: `conflict-candidate-${p1.id}-${p2.id}`,
          projectIds: [p1.id, p2.id],
          type: 'spatial_proximity',
          temporalBasis: null,
          spatialBasis: `Projects are approximately ${Math.round(distance)}m apart.`,
          reason: `Nearby projects, but no verified schedule overlap in available data.`,
          severity: 'candidate',
          evidence: [],
        });
      }
    }
  }

  return conflicts;
}
