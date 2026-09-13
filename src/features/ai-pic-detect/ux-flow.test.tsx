import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getMockAnalysisResponse } from './mock';
import { ReviewExperience } from './review-experience';
import type { ReviewResponse } from './types';

function deferred() {
  let resolve!: (value: ReviewResponse) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<ReviewResponse>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

async function upload() {
  fireEvent.change(screen.getByLabelText('选择要检查的图片'), {
    target: { files: [new File(['image'], 'test.png', { type: 'image/png' })] },
  });
  await act(async () => {
    vi.advanceTimersByTime(150);
  });
  fireEvent.click(
    within(screen.getByRole('main')).getByRole('button', { name: '开始检查' })
  );
}

describe('UX state integrity', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'URL',
      class extends URL {
        static createObjectURL() {
          return 'blob:test-image';
        }
        static revokeObjectURL() {}
      }
    );
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('keeps the uploaded image and counts real seconds, resets on retry and stops on success', async () => {
    vi.useFakeTimers();
    const first = deferred();
    const retry = deferred();
    const analyze = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(retry.promise);
    render(<ReviewExperience initialView="upload" analyzeImage={analyze} />);
    await upload();
    expect(screen.getByAltText('待检查的二次元人物图')).toHaveAttribute(
      'src',
      expect.stringContaining('blob:')
    );
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText('已等待 1 秒')).toBeVisible();
    act(() => vi.advanceTimersByTime(71000));
    expect(screen.getByText('已等待 1 分 12 秒')).toBeVisible();
    expect(
      screen.getByRole('heading', { name: '正在检查容易被忽略的细节' })
    ).toBeVisible();
    await act(async () => first.reject(new Error('analysis_failed')));
    fireEvent.click(screen.getByRole('button', { name: '再试一次' }));
    expect(screen.getByText('已等待 0 秒')).toBeVisible();
    await act(async () => retry.resolve(getMockAnalysisResponse()));
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.queryByText(/已等待/)).not.toBeInTheDocument();
  });

  it('does not let an abandoned request replace the next upload', async () => {
    vi.useFakeTimers();
    const pending = deferred();
    render(
      <ReviewExperience
        initialView="upload"
        analyzeImage={() => pending.promise}
      />
    );
    await upload();
    fireEvent.click(
      within(screen.getByRole('banner')).getByRole('button', {
        name: /开始检查|回到上传/,
      })
    );
    await act(async () => pending.resolve(getMockAnalysisResponse()));
    expect(
      screen.getByRole('heading', { name: '上传一张 AI 图' })
    ).toBeVisible();
    expect(screen.queryByTestId('result-overview')).not.toBeInTheDocument();
    expect(screen.queryByAltText('待检查图片预览')).not.toBeInTheDocument();
  });

  it('keeps navigation independent of decisions, completes only after all decisions, and clears them for a new image', async () => {
    vi.useFakeTimers();
    render(
      <ReviewExperience
        initialView="upload"
        analyzeImage={async () => getMockAnalysisResponse()}
      />
    );
    await upload();
    await act(async () => {});
    fireEvent.click(screen.getByRole('button', { name: '看下一处' }));
    expect(screen.queryByText(/已确认|已排除/)).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '双眼高光方向不太一致' })
    ).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '确认疑点' }));
    fireEvent.click(screen.getByRole('button', { name: '看下一处' }));
    fireEvent.click(screen.getByRole('button', { name: '排除疑点' }));
    fireEvent.click(screen.getByRole('button', { name: '看下一处' }));
    expect(
      screen.queryByRole('heading', { name: '这次检查完成了' })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '确认疑点' }));
    expect(
      screen.getByRole('heading', { name: '这次检查完成了' })
    ).toBeVisible();
    expect(screen.getByTestId('result-overview')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '检查另一张图片' }));
    expect(screen.queryByAltText('待检查图片预览')).not.toBeInTheDocument();
    await upload();
    await act(async () => {});
    expect(
      screen.queryByRole('heading', { name: '这次检查完成了' })
    ).not.toBeInTheDocument();
  });

  it('never links a hand issue to atmosphere or presents a conflicting dimension as clear', async () => {
    vi.useFakeTimers();
    const result = getMockAnalysisResponse();
    result.dimensions = [
      {
        dim_id: 'A1',
        state: 'review_recommended',
        issue_id: result.issues[0].id,
      },
      { dim_id: 'A2', state: 'review_recommended' },
      { dim_id: 'B1', state: 'no_high_confidence_issue' },
    ];
    render(
      <ReviewExperience
        initialView="upload"
        analyzeImage={async () => result}
      />
    );
    await upload();
    await act(async () => {});
    expect(
      screen.queryByRole('button', { name: /定位维度 A1/ })
    ).not.toBeInTheDocument();
    const hand = screen
      .getByText('手部结构', { selector: '[data-dimension-label]' })
      .closest('li');
    expect(hand).toHaveTextContent('暂不判断');
    expect(hand).not.toHaveTextContent('暂未发现明确疑点');
  });
});
