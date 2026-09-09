import { ANALYSIS_CANDIDATE_CATEGORIES } from './contract';
import { ANALYSIS_DIMENSION_IDS } from './dimension-map';

const DEFAULT_RESPONSES_URL = 'https://api.evolink.ai/v1/responses';
const DEFAULT_MODEL = 'deepseek-v4-flash-vision-exp';
export const PROVIDER_TIMEOUT_MS = 120_000;

const SYSTEM_PROMPT = `你是二次元人物图的发布前视觉复核助手。你的任务是提出客观、可见、可定位的候选问题，帮助创作者决定哪里值得人工复核。你不判断图片是否由 AI 生成，不作版权、作者或身份结论。

按以下 17 个候选维度检查图片：
A1 整体风格一致性；A2 画面氛围；A3 光照逻辑；A4 色彩异常；A5 线条质量；
B1 手部结构；B2 眼部；B3 头发；B4 面部；B5 身体结构；B6 透视关系；
C1 边缘与粘连；C2 衣物与褶皱；C3 背景与小物件；C4 层次完整性；C5 穿插与结构逻辑；C6 耳部、头饰与配件。

历史人工复核线索只能帮助检索，不可直接当作结论：文字异常、手指或关节异常、双眼结构差异、发丝粘连、建筑透视矛盾、衣物穿插、边缘粘连和配饰结构异常。

输出纪律：
1. 没有可见且可定位的区域，不输出 issue。
2. 每条 issue 必须明确对象、位置和可见现象，禁止空泛描述。
3. 不设置最低问题数量；不确定或低置信时允许 issues 为空。
4. 使用“疑似”“建议检查”“需人工确认”等谨慎表述。
5. bbox 使用相对于原图的 0 到 1 坐标，且不得超出图片。
6. 仅输出 confidence 大于等于 0.7 的候选。
7. 最多输出 5 条最值得复核的候选，并按修改优先级排序。
8. dimensions 覆盖 17 个维度。只有存在匹配 issue 时才使用 review_recommended；看不见或无法判断时使用 not_assessable；其余使用 no_high_confidence_issue。`;

const USER_PROMPT =
  '请检查这张二次元人物图，并严格按照指定结构返回候选问题和 17 个维度状态。';

type Fetcher = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

export type RawAnalysisOutput = {
  issues: unknown[];
  dimensions?: unknown[];
};

export type ProviderAnalysisErrorCode =
  | 'timeout'
  | 'provider_error'
  | 'invalid_response'
  | 'missing_configuration';

export class ProviderAnalysisError extends Error {
  constructor(
    readonly code: ProviderAnalysisErrorCode,
    readonly statusCode?: number
  ) {
    super(code);
    this.name = 'ProviderAnalysisError';
  }
}

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

function buildJsonSchema() {
  return {
    type: 'json_schema',
    name: 'ai_pic_analysis',
    strict: true,
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        issues: {
          type: 'array',
          maxItems: 5,
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              id: { type: 'string' },
              category: {
                type: 'string',
                enum: [...ANALYSIS_CANDIDATE_CATEGORIES],
              },
              title: { type: 'string' },
              bbox: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  x: { type: 'number', minimum: 0, maximum: 1 },
                  y: { type: 'number', minimum: 0, maximum: 1 },
                  width: { type: 'number', exclusiveMinimum: 0, maximum: 1 },
                  height: { type: 'number', exclusiveMinimum: 0, maximum: 1 },
                },
                required: ['x', 'y', 'width', 'height'],
              },
              priority: {
                type: 'string',
                enum: ['high', 'medium', 'low'],
              },
              confidence: { type: 'number', minimum: 0, maximum: 1 },
              reason: { type: 'string' },
              suggestion: { type: 'string' },
              dim_id: {
                type: ['string', 'null'],
                enum: [...ANALYSIS_DIMENSION_IDS, null],
              },
            },
            required: [
              'id',
              'category',
              'title',
              'bbox',
              'priority',
              'confidence',
              'reason',
              'suggestion',
              'dim_id',
            ],
          },
        },
        dimensions: {
          type: 'array',
          minItems: 17,
          maxItems: 17,
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              dim_id: { type: 'string', enum: [...ANALYSIS_DIMENSION_IDS] },
              state: {
                type: 'string',
                enum: [
                  'review_recommended',
                  'no_high_confidence_issue',
                  'not_assessable',
                ],
              },
              issue_id: { type: ['string', 'null'] },
            },
            required: ['dim_id', 'state', 'issue_id'],
          },
        },
      },
      required: ['issues', 'dimensions'],
    },
  };
}

function extractAnalysisText(envelope: unknown): string | null {
  if (!isRecord(envelope)) return null;

  if (typeof envelope.output_text === 'string') {
    return envelope.output_text;
  }

  if (!Array.isArray(envelope.output)) return null;

  for (const item of envelope.output) {
    if (!isRecord(item) || !Array.isArray(item.content)) continue;

    for (const content of item.content) {
      if (isRecord(content) && typeof content.text === 'string') {
        return content.text;
      }
    }
  }

  return null;
}

function stripCodeFence(value: string): string {
  const trimmed = value.trim();
  if (!trimmed.startsWith('```')) return trimmed;

  const withoutOpeningFence = trimmed.replace(/^```(?:json)?\s*/i, '');
  return withoutOpeningFence.replace(/\s*```$/, '').trim();
}

function omitNullField(value: unknown, field: 'dim_id' | 'issue_id'): unknown {
  if (!isRecord(value) || value[field] !== null) return value;

  const copy = { ...value };
  delete copy[field];
  return copy;
}

function normalizeAnalysisOutput(value: unknown): RawAnalysisOutput {
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

function isTimeoutError(error: unknown): boolean {
  return (
    (error instanceof DOMException &&
      (error.name === 'AbortError' || error.name === 'TimeoutError')) ||
    (isRecord(error) &&
      (error.name === 'AbortError' || error.name === 'TimeoutError'))
  );
}

export async function analyzeImageWithEvolink(
  dataUrl: string,
  options: AnalyzeOptions = {}
): Promise<RawAnalysisOutput> {
  const apiKey = options.apiKey ?? process.env.EVOLINK_API_KEY;
  if (!apiKey) {
    throw new ProviderAnalysisError('missing_configuration');
  }

  const fetcher = options.fetcher ?? fetch;
  let response: Response;

  try {
    response = await fetcher(
      options.baseUrl ??
        process.env.EVOLINK_RESPONSES_URL ??
        DEFAULT_RESPONSES_URL,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model:
            options.model ??
            process.env.EVOLINK_RESPONSES_MODEL ??
            DEFAULT_MODEL,
          instructions: SYSTEM_PROMPT,
          input: [
            {
              role: 'user',
              content: [
                { type: 'input_text', text: USER_PROMPT },
                { type: 'input_image', image_url: dataUrl },
              ],
            },
          ],
          text: { format: buildJsonSchema() },
          store: false,
        }),
        signal: AbortSignal.timeout(options.timeoutMs ?? PROVIDER_TIMEOUT_MS),
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

  const analysisText = extractAnalysisText(envelope);
  if (analysisText === null) {
    throw new ProviderAnalysisError('invalid_response');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFence(analysisText));
  } catch {
    throw new ProviderAnalysisError('invalid_response');
  }

  return normalizeAnalysisOutput(parsed);
}
