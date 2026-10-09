import { Project } from './types';
import { parseISO, isAfter, differenceInDays } from 'date-fns';

export type DelayFinding = {
  projectId: string;
  isOverdue: boolean; // ongoing but past planned end date
  isLateCompleted: boolean; // completed, but actual end > planned end
  daysLate: number | null;
  reason: string;
};

export function analyzeDelay(project: Project): DelayFinding | null {
  if (!project.plannedEndDate) return null;

  const plannedEnd = parseISO(project.plannedEndDate);
  const now = new Date(); // or we could pass a reference date

  if (project.status === 'completed' && project.actualEndDate) {
    const actualEnd = parseISO(project.actualEndDate);
    if (isAfter(actualEnd, plannedEnd)) {
      return {
        projectId: project.id,
        isOverdue: false,
        isLateCompleted: true,
        daysLate: differenceInDays(actualEnd, plannedEnd),
        reason: `Completed late: actual finish date was after the planned deadline.`,
      };
    }
  } else if (project.status !== 'completed' && project.status !== 'unknown') {
    if (isAfter(now, plannedEnd)) {
      return {
        projectId: project.id,
        isOverdue: true,
        isLateCompleted: false,
        daysLate: differenceInDays(now, plannedEnd),
        reason: `Currently overdue: planned end date has passed and project is not marked completed.`,
      };
    }
  }

  return null;
}
