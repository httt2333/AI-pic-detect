import { ANALYSIS_CANDIDATE_CATEGORIES } from '@/features/analyze/contract';
import { ANALYSIS_DIMENSION_IDS } from '@/features/analyze/dimension-map';
import { z } from 'zod';

import type { ReviewResponse } from './types';

type Fetcher = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

// Validate the public boundary, not provider data. Never filter or truncate here.
const publicResponseSchema = z
  .object({
    status: z.enum(['success', 'no_issue']),
    summary: z.object({
      issue_count: z.number().int().nonnegative(),
      high_priority_count: z.number().int().nonnegative(),
    }),
    issues: z.array(
      z.object({
        id: z.string().min(1),
        category: z.enum(ANALYSIS_CANDIDATE_CATEGORIES),
        title: z.string().min(1),
        reason: z.string().min(1),
        suggestion: z.string().min(1),
        priority: z.enum(['high', 'medium', 'low']),
        confidence: z.number().min(0).max(1),
        dim_id: z.enum(ANALYSIS_DIMENSION_IDS).optional(),
        bbox: z
          .object({
            x: z.number().min(0).max(1),
            y: z.number().min(0).max(1),
            width: z.number().positive().max(1),
            height: z.number().positive().max(1),
          })
          .refine((box) => box.x + box.width <= 1 && box.y + box.height <= 1),
      })
    ),
    dimensions: z.array(
      z.object({
        dim_id: z.enum(ANALYSIS_DIMENSION_IDS),
        state: z.enum([
          'review_recommended',
          'no_high_confidence_issue',
          'not_assessable',
        ]),
        issue_id: z.string().optional(),
      })
    ),
  })
  .refine(
    (result) =>
      result.summary.issue_count === result.issues.length &&
      new Set(result.issues.map((issue) => issue.id)).size ===
        result.issues.length &&
      (result.status === 'no_issue'
        ? result.issues.length === 0
        : result.issues.length > 0)
  );

export async function analyzeRealImage(
  file: File,
  fetcher: Fetcher = fetch
): Promise<ReviewResponse> {
  const formData = new FormData();
  formData.append('image', file);

  let response: Response;
  try {
    response = await fetcher('/api/ai-pic-detect/analyze', {
      method: 'POST',
      body: formData,
    });
  } catch {
    throw new Error('analysis_failed');
  }

  if (!response.ok) {
    if (response.status === 415 || response.status === 400) {
      throw new Error('unsupported');
    }
    if (response.status === 504) {
      throw new Error('analysis_timeout');
    }
    throw new Error('analysis_failed');
  }

  try {
    const payload: unknown = await response.json();
    return publicResponseSchema.parse(payload);
  } catch {
    throw new Error('analysis_failed');
  }
}
