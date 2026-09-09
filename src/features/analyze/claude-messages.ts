import { ANALYSIS_CANDIDATE_CATEGORIES } from './contract';
import { ANALYSIS_DIMENSION_IDS } from './dimension-map';
import {
  ProviderAnalysisError,
  type RawAnalysisOutput,
} from './evolink-responses';

const DEFAULT_BASE_URL = 'https://api.evolink.ai';
const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929';
export const CLAUDE_TIMEOUT_MS = 120_000;

type Fetcher = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

type AnalyzeOptions = {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
  fetcher?: Fetcher;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && !Array.isArray(value) && typeof value === 'object';
}

function imageDataUrl(value: string): { mediaType: string; data: string } {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([\s\S]+)$/.exec(
    value
  );
  if (!match) throw new ProviderAnalysisError('invalid_response');
  return { mediaType: match[1], data: match[2] };
}

function stripCodeFence(value: string): string {
  const trimmed = value.trim();
  if (!trimmed.startsWith('```')) return trimmed;
  return trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
}

function extractText(value: unknown): string | null {
  if (!isRecord(value) || !Array.isArray(value.content)) return null;
  for (const block of value.content) {
    if (isRecord(block) && typeof block.text === 'string') return block.text;
  }
  return null;
}

function normalize(value: unknown): RawAnalysisOutput {
  if (!isRecord(value) || !Array.isArray(value.issues)) {
    throw new ProviderAnalysisError('invalid_response');
  }
  return {
    issues: value.issues.map((issue) => omitNullField(issue, 'dim_id')),
    dimensions: Array.isArray(value.dimensions)
      ? value.dimensions.map((dimension) =>
          omitNullField(dimension, 'issue_id')
        )
      : undefined,
  };
}

function omitNullField(value: unknown, field: 'dim_id' | 'issue_id'): unknown {
  if (!isRecord(value) || value[field] !== null) return value;
  const copy = { ...value };
  delete copy[field];
  return copy;
}

function isTimeoutError(error: unknown): boolean {
  return (
    (error instanceof DOMException &&
      (error.name === 'AbortError' || error.name === 'TimeoutError')) ||
    (isRecord(error) &&
      (error.name === 'AbortError' || error.name === 'TimeoutError'))
  );
}

const SYSTEM_PROMPT =
  '你是二次元人物图的发布前视觉复核助手。只提出客观、可见、可定位的候选问题，不判断图片是否由 AI 生成，不作版权、作者或身份结论。';

const USER_PROMPT = `请检查图片并只返回一个 JSON 对象，不要 Markdown、解释或代码围栏。
没有具体可见区域就不要输出 issue，不设置最低问题数量，不要为了凑数输出问题。只输出置信度 >= 0.7 的候选，最多 5 条。bbox 使用相对于原图的归一化对象 x/y/width/height，范围为 0 到 1。文本必须使用“疑似”“建议检查”“需人工确认”等谨慎表述。

17 个维度：${ANALYSIS_DIMENSION_IDS.join(', ')}。
允许的 category：${ANALYSIS_CANDIDATE_CATEGORIES.join(', ')}。
返回结构必须符合以下形状：
{
  "issues": [{
    "id": "唯一字符串",
    "category": "允许的 category",
    "title": "简短标题",
    "bbox": {"x": 0, "y": 0, "width": 0.1, "height": 0.1},
    "priority": "high|medium|low",
    "confidence": 0.7,
    "reason": "具体对象、位置和可见现象",
    "suggestion": "可执行的人工检查建议",
    "dim_id": "A1-C6 中的一个维度或 null"
  }],
  "dimensions": [{"dim_id": "A1-C6", "state": "review_recommended|no_high_confidence_issue|not_assessable", "issue_id": "对应 issue id 或 null"}]
}
dimensions 必须覆盖全部 17 个维度，每个 dim_id 只出现一次。`;

export async function analyzeImageWithClaude(
  dataUrl: string,
  options: AnalyzeOptions = {}
): Promise<RawAnalysisOutput> {
  const apiKey = options.apiKey ?? process.env.EVOLINK_API_KEY;
  if (!apiKey) throw new ProviderAnalysisError('missing_configuration');

  const { mediaType, data } = imageDataUrl(dataUrl);
  const fetcher = options.fetcher ?? fetch;
  let response: Response;

  try {
    response = await fetcher(
      `${options.baseUrl ?? process.env.EVOLINK_BASE_URL ?? DEFAULT_BASE_URL}/v1/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model:
            options.model ??
            process.env.EVOLINK_CLAUDE_MODEL ??
            process.env.EVOLINK_MODEL ??
            DEFAULT_MODEL,
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: USER_PROMPT },
                {
                  type: 'image',
                  source: { type: 'base64', media_type: mediaType, data },
                },
              ],
            },
          ],
        }),
        signal: AbortSignal.timeout(options.timeoutMs ?? CLAUDE_TIMEOUT_MS),
      }
    );
  } catch (error) {
    throw new ProviderAnalysisError(
      isTimeoutError(error) ? 'timeout' : 'provider_error'
    );
  }

  if (!response.ok) {
    throw new ProviderAnalysisError('provider_error', response.status);
  }

  let envelope: unknown;
  try {
    envelope = await response.json();
  } catch {
    throw new ProviderAnalysisError('invalid_response');
  }

  const text = extractText(envelope);
  if (!text) throw new ProviderAnalysisError('invalid_response');

  try {
    return normalize(JSON.parse(stripCodeFence(text)));
  } catch (error) {
    if (error instanceof ProviderAnalysisError) throw error;
    throw new ProviderAnalysisError('invalid_response');
  }
}
