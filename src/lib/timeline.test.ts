import { describe, it, expect, vi } from 'vitest';
import { analyzeDelay } from './timeline';
import { Project } from './types';

describe('Timeline Delay Analysis', () => {
  it('detects a completed late project', () => {
    const project = {
      id: '1',
      status: 'completed',
      plannedEndDate: '2026-05-15',
      actualEndDate: '2026-05-20', // 5 days late
    } as Project;

    const finding = analyzeDelay(project);
    expect(finding).not.toBeNull();
    expect(finding?.isLateCompleted).toBe(true);
    expect(finding?.isOverdue).toBe(false);
    expect(finding?.daysLate).toBe(5);
  });

  it('detects an ongoing overdue project', () => {
    // Mock current date to be after planned end date
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01'));

    const project = {
      id: '2',
      status: 'ongoing',
      plannedEndDate: '2026-05-15',
    } as Project;

    const finding = analyzeDelay(project);
    expect(finding).not.toBeNull();
    expect(finding?.isOverdue).toBe(true);
    expect(finding?.isLateCompleted).toBe(false);
    expect(finding?.daysLate).toBe(17);

    vi.useRealTimers();
  });

  it('returns null for completed on time', () => {
    const project = {
      id: '3',
      status: 'completed',
      plannedEndDate: '2026-05-15',
      actualEndDate: '2026-05-10', // Early
    } as Project;

    const finding = analyzeDelay(project);
    expect(finding).toBeNull();
  });
});
