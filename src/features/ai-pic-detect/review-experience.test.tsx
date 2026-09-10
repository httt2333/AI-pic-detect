import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getMockAnalysisResponse } from './mock';
import {
  ANALYSIS_TIMEOUT_MS,
  ImageStage,
  ReviewExperience,
} from './review-experience';

describe('ReviewExperience', () => {
  afterEach(() => vi.useRealTimers());
  it('allows enough time for the validated vision provider to respond', () => {
    expect(ANALYSIS_TIMEOUT_MS).toBeGreaterThanOrEqual(120_000);
  });

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

    expect(screen.getByRole('banner')).toHaveClass('fixed');
    expect(screen.getByRole('link', { name: '登录' })).toHaveAttribute(
      'href',
      '/zh/sign-in?callbackUrl=/reviews'
    );

    expect(
      screen.getByRole('heading', {
        name: '让 AI 图更经得住细看。',
      })
    ).toBeVisible();
    expect(
      screen.getByText('AI IMAGE REVIEW FOR ANIME CREATORS')
    ).toBeVisible();
    expect(
      screen.getByText(
        '帮您找出二次元 AI 图里容易被观众注意到的生成痕迹：哪里不自然，为什么，怎么改。'
      )
    ).toBeVisible();
    const heroScanner = screen.getByRole('slider', {
      name: '拖动扫描示例图',
    });
    expect(heroScanner).toHaveValue('100');
    expect(screen.getByText('第一眼，您看得出来吗？')).toBeVisible();
    expect(screen.getByText('拖动查看 →')).toBeVisible();
    expect(screen.getByText('发现 2 处需要注意的细节')).toHaveAttribute(
      'aria-hidden',
      'true'
    );
    expect(screen.getAllByTestId('hero-location-box')).toHaveLength(2);
    fireEvent.change(heroScanner, { target: { value: '60' } });
    expect(screen.getByTestId('hero-scan-reveal')).toHaveStyle({
      clipPath: 'inset(0 0 0 60%)',
    });
    expect(screen.getByText('发现 2 处需要注意的细节')).toBeVisible();
    expect(screen.getAllByText('FIND')).not.toHaveLength(0);
    expect(screen.getAllByText('UNDERSTAND')).not.toHaveLength(0);
    expect(screen.getAllByText('FIX')).not.toHaveLength(0);
    expect(screen.getByRole('link', { name: '查看示例 →' })).toHaveAttribute(
      'href',
      '#review-story'
    );
    expect(
      screen.queryByRole('heading', {
        name: '图已经很好了。问题往往只藏在最后那几个细节里。',
      })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: '我们和您一起精益求精',
      })
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { name: '先看哪里值得改。' })
    ).toBeVisible();
    expect(screen.getAllByTestId('story-step-number')).toHaveLength(3);
    expect(screen.getByTestId('story-step-number-find')).toHaveTextContent('1');
    expect(
      screen.getByTestId('story-step-number-understand')
    ).toHaveTextContent('2');
    expect(screen.getByTestId('story-step-number-fix')).toHaveTextContent('3');
    for (const stepNumber of screen.getAllByTestId('story-step-number')) {
      expect(within(stepNumber).queryByRole('img')).not.toBeInTheDocument();
    }
    expect(screen.getByTestId('story-stage-image')).toHaveAttribute(
      'data-active-step',
      'find'
    );
    expect(screen.getByTestId('landing-page')).toHaveClass('overflow-x-clip');
    expect(screen.getByTestId('landing-page')).not.toHaveClass(
      'overflow-hidden'
    );
    expect(screen.getByTestId('story-sticky-visual')).toHaveClass(
      'lg:sticky',
      'lg:top-24'
    );
    const problemSection = screen.getByTestId('keep-image-section');
    const problemVisual = screen.getByTestId('keep-image-crops');
    expect(problemVisual).toHaveClass('lg:order-first');
    expect(problemSection).toBeInTheDocument();
    expect(screen.getByTestId('keep-image-section')).toHaveClass(
      'lg:grid-cols-2'
    );
    expect(screen.getByTestId('keep-image-crops')).toHaveAttribute(
      'data-crop-count',
      '3'
    );
    expect(screen.getByTestId('final-cta')).not.toHaveClass('rounded-2xl');
    expect(screen.getByTestId('real-reactions')).toHaveAttribute(
      'data-reaction-count',
      '20'
    );
    expect(
      screen.getByRole('heading', {
        name: '比起直接给您一个结果，我们更在乎观众到底看到了什么。',
      })
    ).toBeVisible();
    expect(screen.getByText('66,457 条公开评论')).toBeVisible();
    expect(screen.getByText('1,149 条高价值反馈')).toBeVisible();
    expect(screen.getByText('50 次样本测试 · 28 轮调试')).toBeVisible();
    expect(screen.getAllByTestId(/reaction-row-/)).toHaveLength(3);
    expect(screen.getByTestId('real-reactions')).toHaveTextContent(
      '用了ai也不检查一下手指，说好的匠人精神呢'
    );
    fireEvent.click(screen.getByRole('button', { name: /UNDERSTAND/ }));
    expect(screen.getByTestId('story-stage-image')).toHaveAttribute(
      'data-active-step',
      'understand'
    );
    fireEvent.click(screen.getByRole('button', { name: /FIX/ }));
    expect(screen.getByTestId('story-stage-image')).toHaveAttribute(
      'data-active-step',
      'fix'
    );
    expect(
      screen.getByRole('heading', { name: '问题在哪，为什么，怎么改。' })
    ).toBeVisible();
    expect(
      screen.getByRole('heading', {
        name: '每次发布前，我们先帮您把明显的问题找出来。',
      })
    ).toBeVisible();

    fireEvent.click(
      screen.getAllByRole('button', { name: '上传图片开始检查' })[0]
    );

    expect(
      screen.getByRole('heading', { name: '上传一张人物图' })
    ).toBeVisible();
    expect(screen.getByLabelText('选择要检查的图片')).toHaveAttribute(
      'accept',
      'image/png,image/jpeg,image/webp'
    );
  });

  it('automatically demonstrates the hero scan once and lets hover take control', () => {
    vi.useFakeTimers();
    render(<ReviewExperience />);

    const heroScanner = screen.getByRole('slider', {
      name: '拖动扫描示例图',
    });
    act(() => vi.advanceTimersByTime(900));
    const interruptedValue = Number((heroScanner as HTMLInputElement).value);
    expect(interruptedValue).toBeLessThan(100);
    expect(interruptedValue).toBeGreaterThan(0);

    fireEvent.mouseEnter(screen.getByTestId('hero-scan-surface'));
    act(() => vi.advanceTimersByTime(4_000));
    expect(heroScanner).toHaveValue(String(interruptedValue));

    vi.useRealTimers();
  });

  it('finishes the automatic hero scan in the visible result state', () => {
    vi.useFakeTimers();
    render(<ReviewExperience />);

    act(() => vi.advanceTimersByTime(3_500));

    expect(screen.getByRole('slider', { name: '拖动扫描示例图' })).toHaveValue(
      '0'
    );
    expect(screen.getByText('发现 2 处需要注意的细节')).toBeVisible();

    vi.useRealTimers();
  });

  it('returns from upload to the requested landing section through the header navigation', () => {
    render(<ReviewExperience initialView="upload" />);

    fireEvent.click(screen.getByRole('link', { name: '怎么检查' }));

    expect(
      screen.getByRole('heading', { name: '先看哪里值得改。' })
    ).toBeVisible();

    fireEvent.click(screen.getByRole('link', { name: '产品边界' }));
    expect(
      screen.getByRole('heading', {
        name: '我们是您的助手，负责提出有依据的判断。',
      })
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

  it('returns to upload when server-side signature validation rejects the image', async () => {
    render(
      <ReviewExperience
        initialView="upload"
        analyzeImage={vi.fn().mockRejectedValue(new Error('unsupported'))}
      />
    );
    fireEvent.change(screen.getByLabelText('选择要检查的图片'), {
      target: {
        files: [new File(['spoofed'], 'character.png', { type: 'image/png' })],
      },
    });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '开始分析' })).toBeEnabled()
    );
    fireEvent.click(screen.getByRole('button', { name: '开始分析' }));

    expect(
      await screen.findByRole('heading', { name: '无法使用这张图片' })
    ).toBeVisible();
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
    expect(screen.getByText('详细检查报告')).toBeVisible();
    const resultOverview = screen.getByTestId('result-overview');
    expect(within(resultOverview).getByTestId('image-panel')).toBeVisible();
    expect(within(resultOverview).getByTestId('issue-panel')).toBeVisible();
    expect(
      within(resultOverview).queryByTestId('detailed-report')
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('detailed-report')).toBeVisible();

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
        name: '让 AI 图更经得住细看。',
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
    expect(screen.getByText('详细检查报告')).toBeVisible();
    expect(
      within(screen.getByTestId('result-overview')).queryByTestId(
        'detailed-report'
      )
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '检查另一张图片' }));
    expect(
      screen.getByRole('heading', { name: '上传一张人物图' })
    ).toBeVisible();
  });

  it('leaves analysing state after a completed empty issue response', async () => {
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
    expect(screen.queryByText('正在扫描局部细节')).not.toBeInTheDocument();
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

  it('guides a creator to credit packs when a future analysis boundary reports no quota', async () => {
    const analyzeImage = vi
      .fn<() => Promise<ReturnType<typeof getMockAnalysisResponse>>>()
      .mockRejectedValue(new Error('quota_exhausted'));
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
      await screen.findByRole('heading', { name: '本次检查额度已用完' })
    ).toBeVisible();
    expect(screen.getByRole('link', { name: '查看额度包' })).toHaveAttribute(
      'href',
      '/zh/pricing'
    );
  });

  it('opens the Chinese credit page from the product header', () => {
    render(<ReviewExperience />);

    expect(screen.getByRole('link', { name: '额度与价格' })).toHaveAttribute(
      'href',
      '/zh/pricing'
    );
  });
});
