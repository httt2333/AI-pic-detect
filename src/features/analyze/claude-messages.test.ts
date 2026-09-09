import { describe, expect, it, vi } from 'vitest';

import { analyzeImageWithClaude, CLAUDE_TIMEOUT_MS } from './claude-messages';

const output = {
  issues: [],
  dimensions: [
    { dim_id: 'A1', state: 'no_high_confidence_issue', issue_id: null },
  ],
};

describe('analyzeImageWithClaude', () => {
  it('uses the EvoLink Claude Messages image protocol', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      Response.json({
        content: [
          {
            type: 'text',
            text: `\`\`\`json\n${JSON.stringify(output)}\n\`\`\``,
          },
        ],
      })
    );

    await expect(
      analyzeImageWithClaude('data:image/png;base64,PNG_DATA', {
        apiKey: 'test-key',
        fetcher,
      })
    ).resolves.toEqual({
      issues: [],
      dimensions: [{ dim_id: 'A1', state: 'no_high_confidence_issue' }],
    });

    const [url, init] = fetcher.mock.calls[0] as [string, RequestInit];
    const payload = JSON.parse(String(init.body));
    expect(url).toBe('https://api.evolink.ai/v1/messages');
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer test-key',
      'anthropic-version': '2023-06-01',
    });
    expect(payload.messages[0].content[1]).toEqual({
      type: 'image',
      source: { type: 'base64', media_type: 'image/png', data: 'PNG_DATA' },
    });
    expect(payload.max_tokens).toBe(4096);
    expect(payload.system).toContain('不判断图片是否由 AI 生成');
  });

  it('maps timeout and malformed responses without exposing provider data', async () => {
    const timeout = await analyzeImageWithClaude(
      'data:image/jpeg;base64,PRIVATE_IMAGE',
      {
        apiKey: 'test-key',
        timeoutMs: CLAUDE_TIMEOUT_MS,
        fetcher: vi
          .fn()
          .mockRejectedValue(new DOMException('timeout', 'TimeoutError')),
      }
    ).catch((error: unknown) => error);
    expect(timeout).toMatchObject({ code: 'timeout' });
    expect(JSON.stringify(timeout)).not.toContain('PRIVATE_IMAGE');

    const invalid = await analyzeImageWithClaude(
      'data:image/jpeg;base64,PRIVATE_IMAGE',
      {
        apiKey: 'test-key',
        fetcher: vi
          .fn()
          .mockResolvedValue(
            Response.json({ content: [{ type: 'text', text: 'not-json' }] })
          ),
      }
    ).catch((error: unknown) => error);
    expect(invalid).toMatchObject({ code: 'invalid_response' });
  });
});
