import { z } from 'zod';

import {
  ANALYSIS_DIMENSION_IDS,
  ANALYSIS_DIMENSIONS,
  type AnalysisDimensionId,
} from './dimension-map';

export const ANALYSIS_CANDIDATE_CATEGORIES = [
  'hand_structure',
  'eye_face',
  'boundary_overlap',
  'accessory_detail',
  'structure_pose',
] as const;

const MINIMUM_CONFIDENCE = 0.7;
const MAXIMUM_ISSUES = 5;

const boundingBoxSchema = z
  .object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    width: z.number().gt(0).max(1),
    height: z.number().gt(0).max(1),
  })
  .strict()
  .refine((box) => box.x + box.width <= 1, {
    message: 'bbox must fit within the image width',
  })
  .refine((box) => box.y + box.height <= 1, {
    message: 'bbox must fit within the image height',
  });

const issueSchema = z
  .object({
    id: z.string().trim().min(1),
    category: z.enum(ANALYSIS_CANDIDATE_CATEGORIES),
    title: z.string().trim().min(1),
    bbox: boundingBoxSchema,
    priority: z.enum(['high', 'medium', 'low']),
    confidence: z.number().min(0).max(1),
    reason: z.string().trim().min(1),
    suggestion: z.string().trim().min(1),
    dim_id: z.enum(ANALYSIS_DIMENSION_IDS).optional(),
  })
  .strict();

const dimensionStateSchema = z.enum([
  'review_recommended',
  'no_high_confidence_issue',
  'not_assessable',
]);

const dimensionSchema = z
  .object({
    dim_id: z.enum(ANALYSIS_DIMENSION_IDS),
    state: dimensionStateSchema,
    issue_id: z.string().trim().min(1).optional(),
  })
  .strict();

const rawOutputSchema = z
  .object({
    issues: z.array(z.unknown()),
    dimensions: z.array(z.unknown()).optional(),
  })
  .passthrough();

export type AnalysisIssue = z.infer<typeof issueSchema>;
export type AnalysisDimension = z.infer<typeof dimensionSchema>;
export type AnalysisDimensionState = z.infer<typeof dimensionStateSchema>;

export type AnalysisResult = {
  status: 'success' | 'no_issue';
  summary: {
    issue_count: number;
    high_priority_count: number;
  };
  issues: AnalysisIssue[];
  dimensions: AnalysisDimension[];
};

export class AnalysisOutputValidationError extends Error {
  constructor() {
    super('Analysis output must contain an issues array.');
    this.name = 'AnalysisOutputValidationError';
  }
}

export function sanitizeAnalysisOutput(output: unknown): AnalysisResult {
  const rawOutput = rawOutputSchema.safeParse(output);

  if (!rawOutput.success) {
    throw new AnalysisOutputValidationError();
  }

  const seenIds = new Set<string>();
  const issues = rawOutput.data.issues.reduce<AnalysisIssue[]>(
    (validIssues, candidate) => {
      const issue = issueSchema.safeParse(candidate);

      if (
        !issue.success ||
        issue.data.confidence < MINIMUM_CONFIDENCE ||
        seenIds.has(issue.data.id) ||
        validIssues.length === MAXIMUM_ISSUES
      ) {
        return validIssues;
      }

      seenIds.add(issue.data.id);
      validIssues.push(issue.data);
      return validIssues;
    },
    []
  );

  const highPriorityCount = issues.filter(
    (issue) => issue.priority === 'high'
  ).length;

  const issuesById = new Map(issues.map((issue) => [issue.id, issue]));
  const dimensionsById = new Map<AnalysisDimensionId, AnalysisDimension>();

  for (const candidate of rawOutput.data.dimensions ?? []) {
    const dimension = dimensionSchema.safeParse(candidate);

    if (!dimension.success || dimensionsById.has(dimension.data.dim_id)) {
      continue;
    }

    const linkedIssue = dimension.data.issue_id
      ? issuesById.get(dimension.data.issue_id)
      : undefined;
    const hasValidLinkedIssue = linkedIssue?.dim_id === dimension.data.dim_id;

    if (dimension.data.issue_id && !hasValidLinkedIssue) {
      dimensionsById.set(dimension.data.dim_id, {
        dim_id: dimension.data.dim_id,
        state: 'no_high_confidence_issue',
      });
      continue;
    }

    dimensionsById.set(
      dimension.data.dim_id,
      dimension.data.issue_id
        ? dimension.data
        : {
            dim_id: dimension.data.dim_id,
            state: dimension.data.state,
          }
    );
  }

  for (const issue of issues) {
    if (!issue.dim_id) {
      continue;
    }

    dimensionsById.set(issue.dim_id, {
      dim_id: issue.dim_id,
      state: 'review_recommended',
      issue_id: issue.id,
    });
  }

  const dimensions = ANALYSIS_DIMENSIONS.map(
    (dimension) =>
      dimensionsById.get(dimension.id) ?? {
        dim_id: dimension.id,
        state: 'not_assessable' as const,
      }
  );

  return {
    status: issues.length > 0 ? 'success' : 'no_issue',
    summary: {
      issue_count: issues.length,
      high_priority_count: highPriorityCount,
    },
    issues,
    dimensions,
  };
}
