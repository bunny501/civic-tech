import { describe, it, expect } from 'vitest';
import { detectConflicts } from './conflicts';
import { Project } from './types';

describe('Conflict Detection', () => {
  it('detects both spatial and temporal overlaps', () => {
    const projects: Project[] = [
      {
        id: '1',
        title: 'Project 1',
        description: '',
        workType: 'water',
        department: 'Water',
        contractor: '',
        status: 'planned',
        plannedStartDate: '2026-05-01',
        plannedEndDate: '2026-05-15',
        actualStartDate: null,
        actualEndDate: null,
        updatedAt: '2026-01-01',
        addressText: 'Main St',
        latitude: 10.000,
        longitude: 20.000,
        sourceIds: [],
        dataOrigin: 'demo'
      },
      {
        id: '2',
        title: 'Project 2',
        description: '',
        workType: 'road',
        department: 'Roads',
        contractor: '',
        status: 'planned',
        plannedStartDate: '2026-05-10',
        plannedEndDate: '2026-05-20',
        actualStartDate: null,
        actualEndDate: null,
        updatedAt: '2026-01-01',
        addressText: 'Main St',
        latitude: 10.0001, // Very close
        longitude: 20.0001,
        sourceIds: [],
        dataOrigin: 'demo'
      }
    ];

    const conflicts = detectConflicts(projects);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].type).toBe('repeated_excavation');
    expect(conflicts[0].severity).toBe('high');
  });

  it('detects boundary date overlaps', () => {
    const projects: Project[] = [
      {
        id: '1',
        title: 'Project 1',
        description: '',
        workType: 'water',
        department: 'Water',
        contractor: '',
        status: 'planned',
        plannedStartDate: '2026-05-01',
        plannedEndDate: '2026-05-15',
        actualStartDate: null,
        actualEndDate: null,
        updatedAt: '2026-01-01',
        addressText: 'Main St',
        latitude: 10.000,
        longitude: 20.000,
        sourceIds: [],
        dataOrigin: 'demo'
      },
      {
        id: '2',
        title: 'Project 2',
        description: '',
        workType: 'road',
        department: 'Roads',
        contractor: '',
        status: 'planned',
        plannedStartDate: '2026-05-15', // Same day boundary overlap
        plannedEndDate: '2026-05-20',
        actualStartDate: null,
        actualEndDate: null,
        updatedAt: '2026-01-01',
        addressText: 'Main St',
        latitude: 10.00005, 
        longitude: 20.00005,
        sourceIds: [],
        dataOrigin: 'demo'
      }
    ];

    const conflicts = detectConflicts(projects);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].type).toBe('repeated_excavation');
  });

  it('does not flag non-overlapping dates', () => {
    const projects: Project[] = [
      {
        id: '1',
        title: 'Project 1',
        description: '',
        workType: 'water',
        department: 'Water',
        contractor: '',
        status: 'planned',
        plannedStartDate: '2026-05-01',
        plannedEndDate: '2026-05-10',
        actualStartDate: null,
        actualEndDate: null,
        updatedAt: '2026-01-01',
        addressText: 'Main St',
        latitude: 10.000,
        longitude: 20.000,
        sourceIds: [],
        dataOrigin: 'demo'
      },
      {
        id: '2',
        title: 'Project 2',
        description: '',
        workType: 'road',
        department: 'Roads',
        contractor: '',
        status: 'planned',
        plannedStartDate: '2026-05-11', // Clearly after
        plannedEndDate: '2026-05-20',
        actualStartDate: null,
        actualEndDate: null,
        updatedAt: '2026-01-01',
        addressText: 'Main St',
        latitude: 10.000, 
        longitude: 20.000,
        sourceIds: [],
        dataOrigin: 'demo'
      }
    ];

    const conflicts = detectConflicts(projects);
    // Should still have spatial candidate finding, but not repeated_excavation
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].type).toBe('spatial_proximity');
    expect(conflicts[0].severity).toBe('candidate');
  });
});
