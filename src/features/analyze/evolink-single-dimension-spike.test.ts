import { describe, expect, it, vi } from 'vitest';

import { runEvoLinkSingleDimensionSpike } from './evolink-single-dimension-spike';

const input = {
  apiKey: 'test-key',
  baseUrl: 'https://example.test',
  model: 'test-model',
  imageBase64: 'test-image',
  mimeType: 'image/jpeg',
  instruction: 'test instruction',
};

function providerResponse(text: string): Response {
  return new Response(
    JSON.stringify({
      candidates: [{ content: { parts: [{ text }] } }],
    })
  );
}

describe('runEvoLinkSingleDimensionSpike', () => {
  it('accepts one historical dimension ID without retaining provider text', async () => {
    const fetcher = vi.fn().mockResolvedValue(providerResponse('B2'));

    const result = await runEvoLinkSingleDimensionSpike(input, fetcher);

    expect(result).toEqual({ status: 'accepted', dimensionId: 'B2' });
    expect(JSON.stringify(result)).not.toContain('test-image');
    expect(JSON.stringify(result)).not.toContain('test instruction');
  });

  it('accepts NONE as a valid no-candidate outcome', async () => {
    const fetcher = vi.fn().mockResolvedValue(providerResponse('NONE'));

    await expect(
      runEvoLinkSingleDimensionSpike(input, fetcher)
    ).resolves.toEqual({ status: 'accepted', dimensionId: 'NONE' });
  });

  it('rejects output containing anything other than a single allowed ID', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(providerResponse('REVIEW_DIM: B2'));

    await expect(
      runEvoLinkSingleDimensionSpike(input, fetcher)
    ).resolves.toEqual({ status: 'invalid_output' });
  });

  it('returns invalid_envelope when candidates are unavailable or malformed', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('{}'));

    await expect(
      runEvoLinkSingleDimensionSpike(input, fetcher)
    ).resolves.toEqual({ status: 'invalid_envelope' });
  });

  it('returns provider_error without retaining a provider error body', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response('private provider error', { status: 503 })
      );

    const result = await runEvoLinkSingleDimensionSpike(input, fetcher);

    expect(result).toEqual({ status: 'provider_error', statusCode: 503 });
    expect(JSON.stringify(result)).not.toContain('private provider error');
  });

  it('maps an aborted fetch to timeout', async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValue(new DOMException('request aborted', 'AbortError'));

    await expect(
      runEvoLinkSingleDimensionSpike(input, fetcher)
    ).resolves.toEqual({ status: 'timeout' });
  });
});
