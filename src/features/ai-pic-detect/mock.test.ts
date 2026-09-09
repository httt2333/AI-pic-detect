import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  analyzeMockImage,
  getMockAnalysisResponse,
  getVisibleIssues,
  REVIEW_CONFIDENCE_THRESHOLD,
} from './mock';

afterEach(() => {
  vi.useRealTimers();
});

describe('AI-PIC-DETECT mock analysis contract', () => {
  it('returns normalized issue locations with actionable review guidance', () => {
    const response = getMockAnalysisResponse('success');
    const issue = response.issues[0];

    expect(issue).toMatchObject({
      id: expect.any(String),
      category: expect.any(String),
      title: expect.any(String),
      priority: expect.stringMatching(/^(high|medium|low)$/),
      confidence: expect.any(Number),
      reason: expect.any(String),
      suggestion: expect.any(String),
      dim_id: expect.stringMatching(/^[ABC][1-6]$/),
    });
    expect(issue.bbox.x).toBeGreaterThanOrEqual(0);
    expect(issue.bbox.y).toBeGreaterThanOrEqual(0);
    expect(issue.bbox.x + issue.bbox.width).toBeLessThanOrEqual(1);
    expect(issue.bbox.y + issue.bbox.height).toBeLessThanOrEqual(1);
  });

  it('hides low-confidence candidates before they reach the result workspace', () => {
    const response = getMockAnalysisResponse('success');

    expect(getVisibleIssues(response.issues)).toEqual(
      response.issues.filter(
        (issue) => issue.confidence >= REVIEW_CONFIDENCE_THRESHOLD
      )
    );
  });

  it('provides all 17 review dimensions without inventing locations', () => {
    const response = getMockAnalysisResponse('success');

    expect(response.dimensions).toHaveLength(17);
    expect(response.dimensions).toContainEqual({
      dim_id: 'B1',
      state: 'review_recommended',
      issue_id: response.issues[0].id,
    });
    expect(response.dimensions).toContainEqual({
      dim_id: 'A1',
      state: 'no_high_confidence_issue',
    });
    expect(
      response.dimensions.find((dimension) => dimension.dim_id === 'A1')
    ).not.toHaveProperty('issue_id');
  });

  it('returns the same structured response through the temporary async boundary', async () => {
    vi.useFakeTimers();

    const responsePromise = analyzeMockImage();
    await vi.advanceTimersByTimeAsync(650);

    await expect(responsePromise).resolves.toEqual(getMockAnalysisResponse());
  });
});
