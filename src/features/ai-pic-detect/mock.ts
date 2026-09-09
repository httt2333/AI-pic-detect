import { ANALYSIS_DIMENSION_IDS } from '@/features/analyze/dimension-map';

import type { ReviewIssue, ReviewResponse } from './types';

export const REVIEW_CONFIDENCE_THRESHOLD = 0.7;

const mockIssues: ReviewIssue[] = [
  {
    id: 'issue_01',
    category: 'hand_structure',
    title: '手部结构需要检查',
    bbox: { x: 0.62, y: 0.48, width: 0.16, height: 0.22 },
    priority: 'high',
    confidence: 0.86,
    reason: '食指与掌部的连接需要复核。',
    suggestion: '检查食指根部与掌部衔接。',
    dim_id: 'B1',
  },
  {
    id: 'issue_02',
    category: 'eye_face',
    title: '眼部比例建议检查',
    bbox: { x: 0.29, y: 0.22, width: 0.23, height: 0.13 },
    priority: 'medium',
    confidence: 0.79,
    reason: '双眼高度与朝向值得对照。',
    suggestion: '按脸部中线复核高度与朝向。',
    dim_id: 'B2',
  },
  {
    id: 'issue_03',
    category: 'accessory_detail',
    title: '饰品边缘建议复核',
    bbox: { x: 0.17, y: 0.58, width: 0.18, height: 0.16 },
    priority: 'low',
    confidence: 0.74,
    reason: '饰品与衣物边缘可能粘连。',
    suggestion: '放大检查留白和线条分层。',
    dim_id: 'C6',
  },
];

function copyIssue(issue: ReviewIssue): ReviewIssue {
  return { ...issue, bbox: { ...issue.bbox } };
}

function createMockDimensions(
  issues: ReviewIssue[]
): ReviewResponse['dimensions'] {
  const issueByDimension = new Map<string, string>();
  for (const issue of issues) {
    if (issue.dim_id) {
      issueByDimension.set(issue.dim_id, issue.id);
    }
  }

  return ANALYSIS_DIMENSION_IDS.map((dim_id) => {
    const issue_id = issueByDimension.get(dim_id);

    return issue_id
      ? { dim_id, state: 'review_recommended' as const, issue_id }
      : { dim_id, state: 'no_high_confidence_issue' as const };
  });
}

export function getVisibleIssues(
  issues: ReviewIssue[],
  confidenceThreshold = REVIEW_CONFIDENCE_THRESHOLD
): ReviewIssue[] {
  return issues.filter((issue) => issue.confidence >= confidenceThreshold);
}

export function getMockAnalysisResponse(
  scenario: 'success' | 'no_issue' = 'success'
): ReviewResponse {
  const issues =
    scenario === 'success' ? getVisibleIssues(mockIssues).map(copyIssue) : [];

  return {
    status: issues.length > 0 ? 'success' : 'no_issue',
    summary: {
      issue_count: issues.length,
      high_priority_count: issues.filter((issue) => issue.priority === 'high')
        .length,
    },
    issues,
    dimensions: createMockDimensions(issues),
  };
}

export async function analyzeMockImage(): Promise<ReviewResponse> {
  await new Promise<void>((resolve) => window.setTimeout(resolve, 650));
  return getMockAnalysisResponse();
}
