import { LEGACY_VISUAL_DIMENSIONS } from './migration-corpus';

const VALID_DIMENSION_IDS: ReadonlySet<string> = new Set(
  LEGACY_VISUAL_DIMENSIONS.map((dimension) => dimension.id)
);

type Fetcher = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

export type EvoLinkSingleDimensionSpikeInput = {
  apiKey: string;
  baseUrl: string;
  model: string;
  imageBase64: string;
  mimeType: string;
  instruction: string;
  timeoutMs?: number;
};

export type EvoLinkSingleDimensionSpikeResult =
  | { status: 'accepted'; dimensionId: string }
  | { status: 'invalid_output' }
  | { status: 'provider_error'; statusCode: number }
  | { status: 'timeout' }
  | { status: 'invalid_envelope' };

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && !Array.isArray(value) && typeof value === 'object';
}

function extractCandidateText(envelope: unknown): string | null {
  if (!isRecord(envelope) || !Array.isArray(envelope.candidates)) {
    return null;
  }

  const candidate = envelope.candidates[0];
  if (!isRecord(candidate) || !isRecord(candidate.content)) {
    return null;
  }

  const parts = candidate.content.parts;
  if (!Array.isArray(parts)) {
    return null;
  }

  const text = parts.reduce<string>((combined, part) => {
    if (!isRecord(part) || typeof part.text !== 'string') {
      return combined;
    }

    return combined + part.text;
  }, '');

  return text.length > 0 ? text : null;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

/**
 * Runs a non-production, single-dimension vision probe. Its result is designed
 * to be safe to log because it excludes the image, instruction, and raw output.
 */
export async function runEvoLinkSingleDimensionSpike(
  input: EvoLinkSingleDimensionSpikeInput,
  fetcher: Fetcher = fetch
): Promise<EvoLinkSingleDimensionSpikeResult> {
  try {
    const response = await fetcher(
      `${input.baseUrl.replace(/\/$/, '')}/v1beta/models/${encodeURIComponent(input.model)}:generateContent`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${input.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: input.instruction },
                {
                  inlineData: {
                    mimeType: input.mimeType,
                    data: input.imageBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 16,
            thinkingConfig: { thinkingLevel: 'low' },
          },
        }),
        signal: AbortSignal.timeout(input.timeoutMs ?? 120_000),
      }
    );

    if (!response.ok) {
      return { status: 'provider_error', statusCode: response.status };
    }

    let envelope: unknown;
    try {
      envelope = await response.json();
    } catch {
      return { status: 'invalid_envelope' };
    }

    const candidateText = extractCandidateText(envelope);
    if (candidateText === null) {
      return { status: 'invalid_envelope' };
    }

    const dimensionId = candidateText.trim().toUpperCase();
    if (dimensionId === 'NONE' || VALID_DIMENSION_IDS.has(dimensionId)) {
      return { status: 'accepted', dimensionId };
    }

    return { status: 'invalid_output' };
  } catch (error) {
    return isAbortError(error)
      ? { status: 'timeout' }
      : { status: 'provider_error', statusCode: 0 };
  }
}
