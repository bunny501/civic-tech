import { z } from 'zod';
import { mockProjects } from './data';
import { detectConflicts } from './conflicts';
import { analyzeDelay } from './timeline';
import { getDistance } from './neighborhood';

export const agentTools = {
  searchProjects: {
    description: 'Search for projects by status, work type, or department.',
    parameters: z.object({
      status: z.string().optional(),
      workType: z.string().optional(),
      department: z.string().optional(),
    }),
    execute: async ({ status, workType, department }: { status?: string, workType?: string, department?: string }) => {
      let results = mockProjects;
      if (status) results = results.filter(p => p.status.toLowerCase() === status.toLowerCase());
      if (workType) results = results.filter(p => p.workType.toLowerCase() === workType.toLowerCase());
      if (department) results = results.filter(p => p.department?.toLowerCase() === department.toLowerCase());
      return results.slice(0, 5).map(p => ({ id: p.id, title: p.title, status: p.status, dates: `${p.plannedStartDate} to ${p.plannedEndDate}` }));
    },
  },
  getProjectDetails: {
    description: 'Get full details of a specific project by ID.',
    parameters: z.object({ projectId: z.string() }),
    execute: async ({ projectId }: { projectId: string }) => {
      const project = mockProjects.find(p => p.id === projectId);
      if (!project) return { error: `Project ${projectId} not found.` };
      return project;
    },
  },
  getProjectTimeline: {
    description: 'Analyze delay and timeline for a specific project.',
    parameters: z.object({ projectId: z.string() }),
    execute: async ({ projectId }: { projectId: string }) => {
      const project = mockProjects.find(p => p.id === projectId);
      if (!project) return { error: `Project ${projectId} not found.` };
      const analysis = analyzeDelay(project);
      if (!analysis) return { message: 'Project is on schedule or lacks planned dates.' };
      return analysis;
    },
  },
  getNeighborhoodWorks: {
    description: 'Find projects near a specific coordinate within a date window.',
    parameters: z.object({
      latitude: z.number(),
      longitude: z.number(),
      radiusMeters: z.number().max(5000).default(500),
    }),
    execute: async ({ latitude, longitude, radiusMeters }: { latitude: number, longitude: number, radiusMeters: number }) => {
      const results = mockProjects.filter(p => {
        if (!p.latitude || !p.longitude) return false;
        const dist = getDistance(latitude, longitude, p.latitude, p.longitude);
        return dist <= radiusMeters;
      });
      return results.map(p => ({ id: p.id, title: p.title, distance: Math.round(getDistance(latitude, longitude, p.latitude!, p.longitude!)) }));
    },
  },
  findConflicts: {
    description: 'Check deterministic conflicts involving a specific project.',
    parameters: z.object({ projectId: z.string() }),
    execute: async ({ projectId }: { projectId: string }) => {
      const allConflicts = detectConflicts(mockProjects);
      const projectConflicts = allConflicts.filter(c => c.projectIds.includes(projectId));
      return projectConflicts;
    }
  }
};
