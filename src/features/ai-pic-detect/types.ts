import type {
  AnalysisIssue,
  AnalysisResult,
} from '@/features/analyze/contract';

export type ReviewStatus =
  | 'idle'
  | 'uploading'
  | 'analysing'
  | 'success'
  | 'no_issue'
  | 'unsupported'
  | 'timeout'
  | 'analysis_failed';

export type IssueDecision = 'ignored';

export type ReviewIssue = AnalysisIssue;
export type ReviewResponse = AnalysisResult;
