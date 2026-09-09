import { describe, expect, it, vi } from 'vitest';

import { createAnalyzeHandler } from './analyze-handler';
import { ProviderAnalysisError } from './evolink-responses';

const pngBytes = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
]);

function imageRequest(file?: File) {
  const form = new FormData();
  if (file) form.append('image', file);
  return { formData: async () => form };
}

describe('createAnalyzeHandler', () => {
  it('rejects a request without an image', async () => {
    const analyze = vi.fn();
    const response = await createAnalyzeHandler({ analyze })(imageRequest());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'unsupported' });
    expect(analyze).not.toHaveBeenCalled();
  });

  it('rejects unsupported image bytes before calling the provider', async () => {
    const analyze = vi.fn();
    const handler = createAnalyzeHandler({ analyze });
    const response = await handler(
      imageRequest(
        new File([Uint8Array.from([0x00, 0x11, 0x22])], 'unknown.png', {
          type: 'image/png',
        })
      )
    );

    expect(response.status).toBe(415);
    await expect(response.json()).resolves.toEqual({ error: 'unsupported' });
    expect(analyze).not.toHaveBeenCalled();
  });

  it('sanitizes provider output before returning the public result', async () => {
    const analyze = vi.fn().mockResolvedValue({
      issues: [
        {
          id: 'hand-1',
          category: 'hand_structure',
          title: '手部结构建议检查',
          bbox: { x: 0.6, y: 0.4, width: 0.15, height: 0.2 },
          priority: 'high',
          confidence: 0.86,
          reason: '右手食指与掌部连接处疑似不自然。',
          suggestion: '建议检查关节连接与轮廓连续性。',
          dim_id: 'B1',
        },
        {
          id: 'low-confidence',
          category: 'eye_face',
          title: '低置信候选',
          bbox: { x: 0.2, y: 0.2, width: 0.1, height: 0.1 },
          priority: 'low',
          confidence: 0.4,
          reason: '不确定。',
          suggestion: '人工确认。',
          dim_id: 'B2',
        },
      ],
      dimensions: [],
    });
    const handler = createAnalyzeHandler({ analyze });
    const response = await handler(
      imageRequest(new File([pngBytes], 'character.png', { type: 'image/png' }))
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      status: 'success',
      summary: { issue_count: 1, high_priority_count: 1 },
      issues: [{ id: 'hand-1' }],
    });
    expect(body.dimensions).toHaveLength(17);
    expect(analyze).toHaveBeenCalledWith(
      expect.stringMatching(/^data:image\/png;base64,/)
    );
  });

  it('passes the detected MIME type when the uploaded declaration is wrong', async () => {
    const analyze = vi.fn().mockResolvedValue({ issues: [], dimensions: [] });
    const handler = createAnalyzeHandler({ analyze });
    const response = await handler(
      imageRequest(
        new File(
          [Uint8Array.from([0xff, 0xd8, 0xff, 0xe0])],
          'screenshot.png',
          { type: 'image/png' }
        )
      )
    );

    expect(response.status).toBe(200);
    expect(analyze).toHaveBeenCalledWith(
      expect.stringMatching(/^data:image\/jpeg;base64,/)
    );
  });

  it('returns a normal no_issue result when the provider emits no candidates', async () => {
    const handler = createAnalyzeHandler({
      analyze: vi.fn().mockResolvedValue({ issues: [], dimensions: [] }),
    });
    const response = await handler(
      imageRequest(new File([pngBytes], 'clean.png', { type: 'image/png' }))
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: 'no_issue',
      issues: [],
    });
  });

  it('returns safe timeout and failure envelopes without diagnostics', async () => {
    const timeoutHandler = createAnalyzeHandler({
      analyze: vi.fn().mockRejectedValue(new ProviderAnalysisError('timeout')),
    });
    const timeoutResponse = await timeoutHandler(
      imageRequest(new File([pngBytes], 'timeout.png', { type: 'image/png' }))
    );

    expect(timeoutResponse.status).toBe(504);
    await expect(timeoutResponse.json()).resolves.toEqual({ error: 'timeout' });

    const failedHandler = createAnalyzeHandler({
      analyze: vi
        .fn()
        .mockRejectedValue(new ProviderAnalysisError('provider_error', 500)),
    });
    const failedResponse = await failedHandler(
      imageRequest(new File([pngBytes], 'failed.png', { type: 'image/png' }))
    );
    const failedBody = await failedResponse.json();

    expect(failedResponse.status).toBe(502);
    expect(failedBody).toEqual({ error: 'analysis_failed' });
    expect(JSON.stringify(failedBody)).not.toContain('500');
  });

  it('maps malformed provider output and unknown failures to safe errors', async () => {
    const malformedHandler = createAnalyzeHandler({
      analyze: vi.fn().mockResolvedValue({ issues: 'invalid' }),
    });
    const malformedResponse = await malformedHandler(
      imageRequest(new File([pngBytes], 'bad.png', { type: 'image/png' }))
    );
    expect(malformedResponse.status).toBe(502);
    await expect(malformedResponse.json()).resolves.toEqual({
      error: 'analysis_failed',
    });

    const unknownHandler = createAnalyzeHandler({
      analyze: vi.fn().mockRejectedValue(new Error('PRIVATE_DIAGNOSTIC')),
    });
    const unknownResponse = await unknownHandler(
      imageRequest(new File([pngBytes], 'bad.png', { type: 'image/png' }))
    );
    expect(unknownResponse.status).toBe(500);
    await expect(unknownResponse.json()).resolves.toEqual({
      error: 'analysis_failed',
    });
  });
});
