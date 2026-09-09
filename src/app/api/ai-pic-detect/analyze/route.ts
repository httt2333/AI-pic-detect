import { createAnalyzeHandler } from '@/features/analyze/analyze-handler';
import { analyzeImageWithClaude } from '@/features/analyze/claude-messages';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 130;

export const POST = createAnalyzeHandler({
  analyze: analyzeImageWithClaude,
});
