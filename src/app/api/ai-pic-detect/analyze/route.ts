import { createAnalyzeHandler } from '@/features/analyze/analyze-handler';
import { analyzeImageWithEvolink } from '@/features/analyze/evolink-responses';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 130;

export const POST = createAnalyzeHandler({
  analyze: analyzeImageWithEvolink,
});
