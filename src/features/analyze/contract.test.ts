import { describe, expect, it } from 'vitest';

import {
  AnalysisOutputValidationError,
  sanitizeAnalysisOutput,
} from './contract';

const validIssue = {
  id: 'hand-1',
  category: 'hand_structure',
  title: 'Hand structure needs a review',
  bbox: { x: 0.62, y: 0.48, width: 0.16, height: 0.22 },
  priority: 'high',
  confidence: 0.86,
  reason: 'The index finger connection may look unnatural.',
  suggestion: 'Check the finger joints against a hand reference.',
  dim_id: 'B1',
};

describe('sanitizeAnalysisOutput', () => {
  it('returns a stable success response for a valid candidate issue', () => {
    const result = sanitizeAnalysisOutput({ issues: [validIssue] });

    expect(result).toMatchObject({
      status: 'success',
      summary: { issue_count: 1, high_priority_count: 1 },
      issues: [validIssue],
    });
    expect(result.dimensions).toHaveLength(17);
    expect(result.dimensions).toContainEqual({
      dim_id: 'B1',
      state: 'review_recommended',
      issue_id: 'hand-1',
    });
  });

  it('filters low-confidence and invalid candidate issues instead of leaking them', () => {
    expect(
      sanitizeAnalysisOutput({
        issues: [
          { ...validIssue, id: 'low-confidence', confidence: 0.69 },
          { ...validIssue, id: 'invalid-category', category: 'lighting' },
          {
            ...validIssue,
            id: 'out-of-bounds',
            bbox: { x: 0.9, y: 0.48, width: 0.16, height: 0.22 },
          },
          { ...validIssue, id: 'empty-reason', reason: ' ' },
        ],
      })
    ).toMatchObject({
      status: 'no_issue',
      summary: { issue_count: 0, high_priority_count: 0 },
      issues: [],
    });
  });

  it('keeps only the configured maximum number of valid issues', () => {
    const issues = Array.from({ length: 6 }, (_, index) => ({
      ...validIssue,
      id: `issue-${index}`,
    }));

    expect(sanitizeAnalysisOutput({ issues })).toMatchObject({
      status: 'success',
      summary: { issue_count: 5, high_priority_count: 5 },
      issues: issues.slice(0, 5),
    });
  });

  it('rejects an output without an issues array', () => {
    expect(() => sanitizeAnalysisOutput({ issue: validIssue })).toThrow(
      AnalysisOutputValidationError
    );
  });

  it('never exposes a dimension link when its candidate issue was filtered out', () => {
    const result = sanitizeAnalysisOutput({
      issues: [{ ...validIssue, confidence: 0.4 }],
      dimensions: [
        {
          dim_id: 'B1',
          state: 'review_recommended',
          issue_id: 'hand-1',
        },
      ],
    });

    expect(result).toMatchObject({
      status: 'no_issue',
      issues: [],
    });
    expect(result.dimensions).toContainEqual({
      dim_id: 'B1',
      state: 'no_high_confidence_issue',
    });
    expect(
      result.dimensions.find((dimension) => dimension.dim_id === 'B1')
    ).not.toHaveProperty('issue_id');
  });
});
