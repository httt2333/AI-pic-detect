import { ANALYSIS_DIMENSION_IDS } from '@/features/analyze/dimension-map';

import type { ReviewIssue, ReviewResponse } from './types';

export const REVIEW_CONFIDENCE_THRESHOLD = 0.7;

const mockIssues: ReviewIssue[] = [
  {
    id: 'issue_01',
    category: 'hand_structure',
    title: '手指和掌部接得有点生硬',
    bbox: { x: 0.62, y: 0.48, width: 0.16, height: 0.22 },
    priority: 'high',
    confidence: 0.86,
    reason: '手指根部和掌面的连接不够自然，关节转折也有一点突兀。',
    suggestion: '可以先调整手指根部和掌面的连接，再顺一下关节方向。其他区域保持不动。',
    dim_id: 'B1',
  },
  {
    id: 'issue_02',
    category: 'eye_face',
    title: '双眼高光方向不太一致',
    bbox: { x: 0.29, y: 0.22, width: 0.23, height: 0.13 },
    priority: 'medium',
    confidence: 0.79,
    reason: '两只眼睛的高光方向不完全一致，视线关系看起来有一点松动。',
    suggestion: '先统一高光方向和眼睛朝向，其他面部细节保持不动。',
    dim_id: 'B2',
  },
  {
    id: 'issue_03',
    category: 'accessory_detail',
    title: '饰品和衣物边缘有点粘连',
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
