import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { getMockAnalysisResponse } from './mock';
import { ImageStage, ReviewExperience } from './review-experience';

describe('ReviewExperience', () => {
  it('places markers inside the rendered image frame instead of its letterbox', () => {
    const issue = getMockAnalysisResponse().issues[0];
    const { getByTestId } = render(
      <ImageStage
        previewUrl="blob:character"
        issues={[issue]}
        selectedIssueId={issue.id}
        onSelectIssue={vi.fn()}
      />
    );
    const stage = getByTestId('image-stage');
    const image = screen.getByAltText('待检查的二次元人物图');

    Object.defineProperties(stage, {
      clientWidth: { configurable: true, value: 400 },
      clientHeight: { configurable: true, value: 500 },
    });
    Object.defineProperties(image, {
      naturalWidth: { configurable: true, value: 1600 },
      naturalHeight: { configurable: true, value: 900 },
    });
    fireEvent.load(image);

    expect(
      screen.getByRole('button', { name: '定位问题 1' }).parentElement
    ).toHaveStyle({
      top: '137.5px',
      height: '225px',
    });
  });

  it('guides a first-time visitor from the landing page into a single-image upload', () => {
    render(<ReviewExperience />);

    expect(
      screen.getByRole('heading', {
        name: '发布前，先把局部问题看清楚。',
      })
    ).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: '上传图片开始检查' }));

    expect(
      screen.getByRole('heading', { name: '上传一张人物图' })
    ).toBeVisible();
    expect(screen.getByLabelText('选择要检查的图片')).toHaveAttribute(
      'accept',
      'image/png,image/jpeg,image/webp'
    );
  });

  it('returns from upload to the requested landing section through the header navigation', () => {
    render(<ReviewExperience initialView="upload" />);

    fireEvent.click(screen.getByRole('link', { name: '使用流程' }));

    expect(
      screen.getByRole('heading', { name: '从图片到可执行的修改建议' })
    ).toBeVisible();

    fireEvent.click(screen.getByRole('link', { name: '产品边界' }));
    expect(
      screen.getByRole('heading', { name: '帮助你判断“哪里值得再看”' })
    ).toBeVisible();
  });

  it('shows a recoverable validation error for unsupported files', () => {
    render(<ReviewExperience initialView="upload" />);
    const input = screen.getByLabelText('选择要检查的图片');
    const unsupportedFile = new File(['image'], 'character.gif', {
      type: 'image/gif',
    });

    fireEvent.change(input, { target: { files: [unsupportedFile] } });

    expect(
      screen.getByRole('heading', { name: '无法使用这张图片' })
    ).toBeVisible();
    expect(screen.getByText('仅支持 PNG、JPG 和 WebP 图片。')).toBeVisible();
    expect(screen.getByRole('button', { name: '开始分析' })).toBeDisabled();
  });

  it('accepts a supported image through drag and drop', async () => {
    render(<ReviewExperience initialView="upload" />);

    fireEvent.drop(screen.getByRole('button', { name: '拖放要检查的图片' }), {
      dataTransfer: {
        files: [new File(['image'], 'character.webp', { type: 'image/webp' })],
      },
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '开始分析' })).toBeEnabled();
    });
  });

  it('connects an issue, its image marker, and the next-item review action', async () => {
    const analyzeImage = vi.fn().mockResolvedValue(getMockAnalysisResponse());
    render(
      <ReviewExperience initialView="upload" analyzeImage={analyzeImage} />
    );

    fireEvent.change(screen.getByLabelText('选择要检查的图片'), {
      target: {
        files: [new File(['image'], 'character.png', { type: 'image/png' })],
      },
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '开始分析' })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: '开始分析' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '检查结果' })).toBeVisible();
    });
    expect(screen.getByText('修改优先级')).toBeVisible();
    expect(screen.getAllByText('高修改优先级')).not.toHaveLength(0);
    expect(screen.getByText('检查维度')).toBeVisible();

    fireEvent.click(
      screen.getByRole('button', { name: '问题 2：眼部比例建议检查' })
    );
    expect(
      screen.getByRole('heading', { name: '眼部比例建议检查' })
    ).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: '定位问题 1' }));
    expect(
      screen.getByRole('heading', { name: '手部结构需要检查' })
    ).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: '定位维度 B2 眼部' }));
    expect(
      screen.getByRole('heading', { name: '眼部比例建议检查' })
    ).toBeVisible();

    fireEvent.click(
      screen.getByRole('button', { name: '定位维度 B1 手部结构' })
    );
    fireEvent.click(screen.getByRole('button', { name: '下一项' }));
    expect(
      screen.getByRole('heading', { name: '眼部比例建议检查' })
    ).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: '忽略此项' }));
    expect(screen.getAllByText('已忽略')).not.toHaveLength(0);

    fireEvent.click(screen.getByRole('button', { name: 'AI-PIC-DETECT' }));
    expect(
      screen.getByRole('heading', {
        name: '发布前，先把局部问题看清楚。',
      })
    ).toBeVisible();
  });

  it('uses cautious no-issue language when no high-confidence issue remains', async () => {
    render(
      <ReviewExperience
        initialView="upload"
        analyzeImage={vi.fn().mockResolvedValue({
          status: 'no_issue',
          summary: { issue_count: 0, high_priority_count: 0 },
          issues: [],
          dimensions: getMockAnalysisResponse('no_issue').dimensions,
        })}
      />
    );

    fireEvent.change(screen.getByLabelText('选择要检查的图片'), {
      target: {
        files: [new File(['image'], 'character.png', { type: 'image/png' })],
      },
    });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '开始分析' })).toBeEnabled()
    );
    fireEvent.click(screen.getByRole('button', { name: '开始分析' }));

    expect(await screen.findByText('暂未发现高修改优先级问题')).toBeVisible();
    expect(
      screen.getByText('本次扫描未给出需要优先修改的局部。')
    ).toBeVisible();
    expect(screen.getByText('检查维度')).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: '检查另一张图片' }));
    expect(
      screen.getByRole('heading', { name: '上传一张人物图' })
    ).toBeVisible();
  });

  it('offers a retry after a controlled analysis failure', async () => {
    const analyzeImage = vi
      .fn<() => Promise<ReturnType<typeof getMockAnalysisResponse>>>()
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockResolvedValueOnce(getMockAnalysisResponse());
    render(
      <ReviewExperience initialView="upload" analyzeImage={analyzeImage} />
    );

    fireEvent.change(screen.getByLabelText('选择要检查的图片'), {
      target: {
        files: [new File(['image'], 'character.png', { type: 'image/png' })],
      },
    });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '开始分析' })).toBeEnabled()
    );
    fireEvent.click(screen.getByRole('button', { name: '开始分析' }));

    expect(
      await screen.findByRole('heading', { name: '这次分析没有完成' })
    ).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '重试分析' }));
    expect(
      await screen.findByRole('heading', { name: '检查结果' })
    ).toBeVisible();
    expect(analyzeImage).toHaveBeenCalledTimes(2);
  });

  it('separates a timeout from a general analysis failure and still allows retry', async () => {
    const analyzeImage = vi
      .fn<() => Promise<ReturnType<typeof getMockAnalysisResponse>>>()
      .mockRejectedValueOnce(new Error('analysis_timeout'))
      .mockResolvedValueOnce(getMockAnalysisResponse());
    render(
      <ReviewExperience initialView="upload" analyzeImage={analyzeImage} />
    );

    fireEvent.change(screen.getByLabelText('选择要检查的图片'), {
      target: {
        files: [new File(['image'], 'character.png', { type: 'image/png' })],
      },
    });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '开始分析' })).toBeEnabled()
    );
    fireEvent.click(screen.getByRole('button', { name: '开始分析' }));

    expect(
      await screen.findByRole('heading', { name: '分析时间较长，暂未完成' })
    ).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '重试分析' }));
    expect(
      await screen.findByRole('heading', { name: '检查结果' })
    ).toBeVisible();
  });
});
