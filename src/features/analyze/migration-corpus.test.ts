import { describe, expect, it } from 'vitest';

import {
  buildMigrationCorpusIndex,
  LEGACY_VISUAL_DIMENSIONS,
} from './migration-corpus';

describe('buildMigrationCorpusIndex', () => {
  it('keeps only known, non-noise dimension evidence', () => {
    const index = buildMigrationCorpusIndex([
      {
        dim_id: 'B1',
        dim_name: 'hand structure',
        hit_element: 'finger joint',
        content: 'raw comment must never be retained',
        author: 'private author',
        source: 'private source URL',
        is_noise: false,
      },
      { dim_id: 'C7', dim_name: 'noise', is_noise: true },
      { dim_id: 'UNKNOWN', dim_name: 'unknown', is_noise: false },
    ]);

    expect(index.sourceRecordCount).toBe(3);
    expect(index.retainedRecordCount).toBe(1);
    expect(index.dimensions.B1).toEqual({
      evidenceCount: 1,
      hitElements: ['finger joint'],
    });
    expect(JSON.stringify(index)).not.toContain('raw comment');
    expect(JSON.stringify(index)).not.toContain('private author');
    expect(JSON.stringify(index)).not.toContain('private source URL');
  });

  it('uses the historical A/B/C dimension vocabulary as the single backend map', () => {
    expect(LEGACY_VISUAL_DIMENSIONS.map((dimension) => dimension.id)).toEqual([
      'A1',
      'A2',
      'A3',
      'A4',
      'A5',
      'B1',
      'B2',
      'B3',
      'B4',
      'B5',
      'B6',
      'C1',
      'C2',
      'C3',
      'C4',
      'C5',
      'C6',
    ]);
  });
});
