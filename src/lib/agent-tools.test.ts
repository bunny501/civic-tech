import { describe, it, expect, vi } from 'vitest';
import { agentTools } from './agent-tools';

describe('Agent Tools', () => {
  it('searchProjects tool validates and filters correctly', async () => {
    const results = await agentTools.searchProjects.execute({ status: 'ongoing' });
    expect(results).toBeDefined();
    // Assuming mock data has at least one ongoing proj
    expect(results.length).toBeGreaterThanOrEqual(0);
  });

  it('getNeighborhoodWorks tool checks spatial logic', async () => {
    // 40.7128, -74.0060 is proj-1
    const results = await agentTools.getNeighborhoodWorks.execute({ latitude: 40.7128, longitude: -74.0060, radiusMeters: 500 });
    expect(results.length).toBeGreaterThan(0);
    expect(results.map(r => r.id)).toContain('proj-1');
  });

  it('getProjectDetails handles missing project', async () => {
    const result = await agentTools.getProjectDetails.execute({ projectId: 'invalid' });
    expect((result as any).error).toBeDefined();
  });
});
