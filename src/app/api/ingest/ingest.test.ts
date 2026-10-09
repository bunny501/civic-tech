import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const ExtractionSchema = z.object({
  title: z.string(),
  description: z.string(),
  department: z.string().nullable(),
  contractor: z.string().nullable(),
  plannedStartDate: z.string().nullable(),
  plannedEndDate: z.string().nullable(),
  addressText: z.string(),
  uncertainFields: z.array(z.string()),
});

describe('Extraction Schema Validation', () => {
  it('validates correct AI structured output', () => {
    const validData = {
      title: 'Water Main Replacement',
      description: 'Replace aging pipes',
      department: 'Water Dept',
      contractor: null,
      plannedStartDate: '2026-06-01',
      plannedEndDate: null,
      addressText: '1st Ave',
      uncertainFields: ['plannedStartDate']
    };
    
    expect(() => ExtractionSchema.parse(validData)).not.toThrow();
  });

  it('fails when mandatory fields are missing', () => {
    const invalidData = {
      description: 'Replace aging pipes',
      // title missing
    };
    
    expect(() => ExtractionSchema.parse(invalidData)).toThrow();
  });
});
