import { describe, expect, it, vi } from 'vitest';

import { analyzeRealImage } from './analyze-client';
import { getMockAnalysisResponse } from './mock';

describe('analyzeRealImage', () => {
  it('posts one image and returns the validated public result', async () => {
    const result = getMockAnalysisResponse('no_issue');
    const fetcher = vi.fn().mockResolvedValue(Response.json(result));
    const file = new File(['image'], 'character.png', { type: 'image/png' });

    await expect(analyzeRealImage(file, fetcher)).resolves.toEqual(result);

    const [url, init] = fetcher.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/ai-pic-detect/analyze');
    expect(init.method).toBe('POST');
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get('image')).toBe(file);
  });

  it.each(['success', 'no_issue'] as const)(
    'accepts a completed %s response so the UI can leave loading',
    async (status) => {
      const result = getMockAnalysisResponse(
        status === 'no_issue' ? 'no_issue' : 'success'
      );
      const fetcher = vi.fn().mockResolvedValue(Response.json(result));

      await expect(
        analyzeRealImage(
          new File(['image'], 'character.png', { type: 'image/png' }),
          fetcher
        )
      ).resolves.toMatchObject({ status, issues: expect.any(Array) });
    }
  );

  it('rejects a malformed 200 response instead of leaving the workflow ambiguous', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        Response.json({ status: 'success', issues: 'not-an-array' })
      );

    await expect(
      analyzeRealImage(
        new File(['image'], 'character.png', { type: 'image/png' }),
        fetcher
      )
    ).rejects.toMatchObject({ message: 'analysis_failed' });
  });

  it.each([
    [415, 'unsupported'],
    [504, 'analysis_timeout'],
    [502, 'analysis_failed'],
  ])(
    'maps HTTP %s to %s without forwarding server details',
    async (status, code) => {
      const fetcher = vi
        .fn()
        .mockResolvedValue(
          Response.json(
            { error: code, detail: 'PRIVATE_PROVIDER_DIAGNOSTIC' },
            { status }
          )
        );

      const error = await analyzeRealImage(
        new File(['image'], 'character.png', { type: 'image/png' }),
        fetcher
      ).catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(Error);
      expect(error).toMatchObject({ message: code });
      expect(JSON.stringify(error)).not.toContain(
        'PRIVATE_PROVIDER_DIAGNOSTIC'
      );
    }
  );

  it('maps network and malformed success responses to analysis_failed', async () => {
    const file = new File(['image'], 'character.png', { type: 'image/png' });
    const networkError = await analyzeRealImage(
      file,
      vi.fn().mockRejectedValue(new TypeError('PRIVATE_NETWORK_ERROR'))
    ).catch((caught: unknown) => caught);
    expect(networkError).toMatchObject({ message: 'analysis_failed' });

    const malformedError = await analyzeRealImage(
      file,
      vi.fn().mockResolvedValue(new Response('not-json'))
    ).catch((caught: unknown) => caught);
    expect(malformedError).toMatchObject({ message: 'analysis_failed' });
  });
});
