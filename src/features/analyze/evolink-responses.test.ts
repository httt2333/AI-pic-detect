import { describe, expect, it, vi } from 'vitest';

import {
  analyzeImageWithEvolink,
  ProviderAnalysisError,
} from './evolink-responses';

function providerEnvelope(analysis: unknown) {
  return {
    output: [
      {
        type: 'message',
        content: [{ type: 'output_text', text: JSON.stringify(analysis) }],
      },
    ],
  };
}

const validIssue = {
  id: 'hand-1',
  category: 'hand_structure',
  title: '手部结构建议检查',
  bbox: { x: 0.6, y: 0.4, width: 0.15, height: 0.2 },
  priority: 'high',
  confidence: 0.86,
  reason: '右手食指与掌部连接处疑似不自然。',
  suggestion: '建议放大检查关节连接与轮廓连续性。',
  dim_id: 'B1',
};

describe('analyzeImageWithEvolink', () => {
  it('rejects missing server configuration before making a request', async () => {
    const fetcher = vi.fn();

    const error = await analyzeImageWithEvolink('data:image/png;base64,test', {
      apiKey: '',
      fetcher,
    }).catch((caught: unknown) => caught);

    expect(error).toMatchObject({ code: 'missing_configuration' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('uses the Responses image protocol and a strict schema without forcing any issue', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      Response.json(
        providerEnvelope({
          issues: [],
          dimensions: [
            {
              dim_id: 'A1',
              state: 'no_high_confidence_issue',
              issue_id: null,
            },
          ],
        })
      )
    );

    await expect(
      analyzeImageWithEvolink('data:image/png;base64,iVBORw0KGgo=', {
        apiKey: 'test-key',
        fetcher,
      })
    ).resolves.toEqual({
      issues: [],
      dimensions: [{ dim_id: 'A1', state: 'no_high_confidence_issue' }],
    });

    const [url, init] = fetcher.mock.calls[0] as [string, RequestInit];
    const payload = JSON.parse(String(init.body));

    expect(url).toBe('https://api.evolink.ai/v1/responses');
    expect(init.headers).toMatchObject({ Authorization: 'Bearer test-key' });
    expect(payload).toMatchObject({
      model: 'deepseek-v4-flash-vision-exp',
      store: false,
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text' },
            {
              type: 'input_image',
              image_url: 'data:image/png;base64,iVBORw0KGgo=',
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          strict: true,
        },
      },
    });
    expect(payload.text.format.schema.properties.issues.maxItems).toBe(5);
    expect(payload.text.format.schema.properties.issues).not.toHaveProperty(
      'minItems'
    );
  });

  it('normalizes nullable strict-schema fields before contract validation', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      Response.json(
        providerEnvelope({
          issues: [{ ...validIssue, dim_id: null }],
          dimensions: [
            {
              dim_id: 'B1',
              state: 'review_recommended',
              issue_id: null,
            },
          ],
        })
      )
    );

    await expect(
      analyzeImageWithEvolink('data:image/jpeg;base64,/9j/', {
        apiKey: 'test-key',
        fetcher,
      })
    ).resolves.toEqual({
      issues: [{ ...validIssue, dim_id: undefined }],
      dimensions: [{ dim_id: 'B1', state: 'review_recommended' }],
    });
  });

  it('accepts top-level output_text and strips a JSON code fence', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      Response.json({
        output_text: `\`\`\`json\n${JSON.stringify({ issues: [] })}\n\`\`\``,
      })
    );

    await expect(
      analyzeImageWithEvolink('data:image/webp;base64,UklGRg==', {
        apiKey: 'test-key',
        fetcher,
      })
    ).resolves.toEqual({ issues: [], dimensions: undefined });
  });

  it('maps aborts to timeout without retaining sensitive input', async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValue(new DOMException('timed out', 'TimeoutError'));

    const error = await analyzeImageWithEvolink(
      'data:image/png;base64,PRIVATE_IMAGE',
      { apiKey: 'test-key', fetcher }
    ).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ProviderAnalysisError);
    expect(error).toMatchObject({ code: 'timeout' });
    expect(JSON.stringify(error)).not.toContain('PRIVATE_IMAGE');
  });

  it('maps provider and envelope failures without exposing raw responses', async () => {
    const httpFetcher = vi
      .fn()
      .mockResolvedValue(
        new Response('PRIVATE_PROVIDER_RESPONSE', { status: 500 })
      );

    const httpError = await analyzeImageWithEvolink(
      'data:image/png;base64,PRIVATE_IMAGE',
      { apiKey: 'test-key', fetcher: httpFetcher }
    ).catch((caught: unknown) => caught);

    expect(httpError).toMatchObject({
      code: 'provider_error',
      statusCode: 500,
    });
    expect(JSON.stringify(httpError)).not.toContain(
      'PRIVATE_PROVIDER_RESPONSE'
    );

    const envelopeFetcher = vi
      .fn()
      .mockResolvedValue(Response.json({ output: [] }));
    const envelopeError = await analyzeImageWithEvolink(
      'data:image/png;base64,PRIVATE_IMAGE',
      { apiKey: 'test-key', fetcher: envelopeFetcher }
    ).catch((caught: unknown) => caught);

    expect(envelopeError).toMatchObject({ code: 'invalid_response' });
    expect(JSON.stringify(envelopeError)).not.toContain('PRIVATE_IMAGE');
  });

  it('maps network, non-JSON, and malformed analysis failures safely', async () => {
    const networkError = await analyzeImageWithEvolink(
      'data:image/png;base64,PRIVATE_IMAGE',
      {
        apiKey: 'test-key',
        fetcher: vi.fn().mockRejectedValue(new TypeError('private network')),
      }
    ).catch((caught: unknown) => caught);
    expect(networkError).toMatchObject({ code: 'provider_error' });

    const nonJsonError = await analyzeImageWithEvolink(
      'data:image/png;base64,PRIVATE_IMAGE',
      {
        apiKey: 'test-key',
        fetcher: vi.fn().mockResolvedValue(new Response('not-json')),
      }
    ).catch((caught: unknown) => caught);
    expect(nonJsonError).toMatchObject({ code: 'invalid_response' });

    const malformedError = await analyzeImageWithEvolink(
      'data:image/png;base64,PRIVATE_IMAGE',
      {
        apiKey: 'test-key',
        fetcher: vi
          .fn()
          .mockResolvedValue(
            Response.json({ output_text: 'PRIVATE_PROVIDER_RESPONSE' })
          ),
      }
    ).catch((caught: unknown) => caught);
    expect(malformedError).toMatchObject({ code: 'invalid_response' });
    expect(JSON.stringify(malformedError)).not.toContain(
      'PRIVATE_PROVIDER_RESPONSE'
    );
  });
});
