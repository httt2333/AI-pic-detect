'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ANALYSIS_DIMENSIONS,
  type AnalysisDimensionId,
} from '@/features/analyze/dimension-map';
import {
  IconAlertCircle,
  IconArrowLeft,
  IconArrowRight,
  IconChevronRight,
  IconCircleCheck,
  IconFocus2,
  IconLoader2,
  IconRefresh,
  IconUpload,
} from '@tabler/icons-react';

import { analyzeRealImage } from './analyze-client';
import { getContainedImageFrame } from './bbox';
import { LandingPage } from './landing-page';
import type {
  IssueDecision,
  ReviewIssue,
  ReviewResponse,
  ReviewStatus,
} from './types';
import { validateReviewImageFile } from './validation';

export const ANALYSIS_TIMEOUT_MS = 130_000;

type ReviewExperienceProps = {
  initialView?: 'landing' | 'upload';
  analyzeImage?: (file: File) => Promise<ReviewResponse>;
};

type ExperienceView = 'landing' | 'upload' | 'workspace';

const priorityCopy = {
  high: '建议先看',
  medium: '值得看看',
  low: '可以留意',
} as const;

const priorityRank = { high: 0, medium: 1, low: 2 } as const;

function sortIssues(issues: ReviewIssue[]): ReviewIssue[] {
  return issues
    .map((issue, index) => ({ issue, index }))
    .sort(
      (a, b) =>
        priorityRank[a.issue.priority] - priorityRank[b.issue.priority] ||
        b.issue.confidence - a.issue.confidence ||
        a.index - b.index
    )
    .map(({ issue }) => issue);
}

const categoryCopy: Record<ReviewIssue['category'], string> = {
  hand_structure: '手部结构',
  eye_face: '五官与透视',
  boundary_overlap: '边缘与遮挡',
  accessory_detail: '饰品细节',
  structure_pose: '结构与姿态',
};

const dimensionGroupCopy = {
  A: '全局画面',
  B: '人物主体',
  C: '局部细节',
} as const;

const dimensionLabelCopy: Record<AnalysisDimensionId, string> = {
  A1: '整体风格一致性',
  A2: '画面氛围',
  A3: '光照逻辑',
  A4: '色彩异常',
  A5: '线条质量',
  B1: '手部结构',
  B2: '眼部',
  B3: '发型与发丝',
  B4: '面部',
  B5: '身体结构',
  B6: '透视关系',
  C1: '边缘与粘连',
  C2: '衣物与褶皱',
  C3: '背景与小物件',
  C4: '层次完整性',
  C5: '穿插与结构逻辑',
  C6: '耳部、头饰与配件',
};

const dimensionStateCopy = {
  review_recommended: '值得注意',
  no_high_confidence_issue: '暂未发现明确疑点',
  not_assessable: '暂不判断',
} as const;

// Presentation guard only: never infer a dimension from free-form model text.
const compatibleDimensions: Record<
  ReviewIssue['category'],
  readonly AnalysisDimensionId[]
> = {
  hand_structure: ['B1'],
  eye_face: ['B2', 'B4'],
  boundary_overlap: ['C1', 'C4', 'C5'],
  accessory_detail: ['C3', 'C6'],
  structure_pose: ['B5', 'B6', 'C5'],
};

const waitingHints = [
  '先从容易忽略的局部开始。',
  '正在整理值得注意的疑点。',
  '有些细节第一眼没问题，放大后才容易发现。',
  '正在把发现整理成更具体的说明。',
  '再仔细看一遍，尽量少把正常细节当成疑点。',
  '检查完成后，会告诉你为什么值得注意、可以怎么改。',
];

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(
      () => reject(new Error('analysis_timeout')),
      timeoutMs
    );

    promise.then(
      (value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      },
      (error: unknown) => {
        window.clearTimeout(timeoutId);
        reject(error);
      }
    );
  });
}

function createPreviewUrl(file: File): string | null {
  if (typeof URL.createObjectURL !== 'function') return null;
  return URL.createObjectURL(file);
}

function revokePreviewUrl(url: string | null) {
  if (url && typeof URL.revokeObjectURL === 'function') {
    URL.revokeObjectURL(url);
  }
}

function ReferenceImage({ alt }: { alt: string }) {
  return (
    <Image
      src="/images/ai-pic-detect/hero-review-sample.png"
      alt={alt}
      fill
      priority
      sizes="(min-width: 1024px) 42vw, 100vw"
      className="object-cover"
    />
  );
}

export function ImageStage({
  previewUrl,
  issues,
  selectedIssueId,
  onSelectIssue,
  withLegend = false,
}: {
  previewUrl: string | null;
  issues: ReviewIssue[];
  selectedIssueId: string | null;
  onSelectIssue: (issueId: string) => void;
  withLegend?: boolean;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageFrame, setImageFrame] = useState<ReturnType<
    typeof getContainedImageFrame
  > | null>(null);
  const updateImageFrame = useCallback(() => {
    const stage = stageRef.current;
    const image = imageRef.current;

    if (
      !stage ||
      !image ||
      stage.clientWidth === 0 ||
      stage.clientHeight === 0 ||
      image.naturalWidth === 0 ||
      image.naturalHeight === 0
    ) {
      return;
    }

    setImageFrame(
      getContainedImageFrame(
        stage.clientWidth,
        stage.clientHeight,
        image.naturalWidth,
        image.naturalHeight
      )
    );
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    const initialFrameId = window.requestAnimationFrame(() => {
      setImageFrame(null);
      updateImageFrame();
    });

    if (!previewUrl || !stage || typeof ResizeObserver === 'undefined') {
      return () => window.cancelAnimationFrame(initialFrameId);
    }

    const observer = new ResizeObserver(updateImageFrame);
    observer.observe(stage);

    return () => {
      window.cancelAnimationFrame(initialFrameId);
      observer.disconnect();
    };
  }, [previewUrl, updateImageFrame]);

  const markers = sortIssues(issues).map((issue, index) => {
    const isSelected = issue.id === selectedIssueId;
    return (
      <button
        key={issue.id}
        type="button"
        aria-label={`定位疑点 ${index + 1}`}
        aria-pressed={isSelected}
        onClick={() => onSelectIssue(issue.id)}
        className={`absolute border-2 text-left transition focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:outline-none ${
          isSelected
            ? 'z-30 border-amber-400 bg-amber-300/15 shadow-[0_0_0_2px_rgba(251,191,36,0.35)]'
            : 'z-10 border-violet-500/80 bg-violet-400/10 hover:border-amber-400'
        }`}
        style={{
          left: `${issue.bbox.x * 100}%`,
          top: `${issue.bbox.y * 100}%`,
          width: `${issue.bbox.width * 100}%`,
          height: `${issue.bbox.height * 100}%`,
        }}
      >
        <span
          className={`absolute top-0 left-0 z-40 grid min-h-6 min-w-6 place-items-center rounded-sm px-1 text-xs font-bold ${
            isSelected
              ? 'bg-amber-400 text-neutral-950'
              : 'bg-violet-700 text-white'
          }`}
        >
          {index + 1}
        </span>
      </button>
    );
  });

  return (
    <div
      ref={stageRef}
      data-testid="image-stage"
      className="relative isolate aspect-[4/5] max-h-[42dvh] w-full overflow-hidden border border-neutral-200 bg-neutral-100 md:max-h-[72dvh]"
    >
      {previewUrl ? (
        <div
          className="absolute overflow-hidden"
          style={
            imageFrame
              ? {
                  left: imageFrame.left,
                  top: imageFrame.top,
                  width: imageFrame.width,
                  height: imageFrame.height,
                }
              : { inset: 0 }
          }
        >
          <img
            ref={imageRef}
            src={previewUrl}
            alt="待检查的二次元人物图"
            onLoad={updateImageFrame}
            className="size-full object-contain"
          />
          {imageFrame ? markers : null}
        </div>
      ) : (
        <>
          <ReferenceImage alt="示例二次元人物图" />
          {markers}
        </>
      )}
      {withLegend ? (
        <div className="absolute right-4 bottom-4 flex items-center gap-2 border border-violet-200 bg-white/90 px-3 py-2 text-xs font-medium text-neutral-950 backdrop-blur">
          <IconFocus2 size={15} stroke={1.8} />
          示例：局部定位
        </div>
      ) : null}
    </div>
  );
}

function ProductHeader({
  openUpload,
  showLanding,
  navigateToSection,
}: {
  openUpload: () => void;
  showLanding: () => void;
  navigateToSection: (
    sectionId: 'how-it-works' | 'why-this' | 'boundaries'
  ) => void;
}) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-violet-100 bg-[#fdfcff]/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 sm:px-8">
        <button
          type="button"
          onClick={showLanding}
          className="text-sm font-bold tracking-[-0.04em] text-neutral-950"
        >
          AI-PIC-DETECT
        </button>
        <nav className="flex items-center gap-5 text-sm font-medium text-violet-800">
          <a
            href="#how-it-works"
            onClick={(event) => {
              event.preventDefault();
              navigateToSection('how-it-works');
            }}
            className="hidden hover:text-neutral-950 sm:block"
          >
            检查流程
          </a>
          <a
            href="#boundaries"
            onClick={(event) => {
              event.preventDefault();
              navigateToSection('boundaries');
            }}
            className="hidden hover:text-neutral-950 sm:block"
          >
            AI边界
          </a>
          <a
            href="#why-this"
            onClick={(event) => {
              event.preventDefault();
              navigateToSection('why-this');
            }}
            className="hidden hover:text-neutral-950 lg:block"
          >
            产品理念
          </a>
          <Link
            href="/zh/pricing"
            className="hidden hover:text-neutral-950 lg:block"
          >
            购买额度
          </Link>
          <Link
            href="/reviews"
            className="hidden hover:text-neutral-950 xl:block"
          >
            检查记录
          </Link>
          <Link
            href="/zh/sign-in?callbackUrl=/reviews"
            className="hidden hover:text-neutral-950 sm:block"
          >
            登录
          </Link>
          <button
            type="button"
            aria-label="开始检查，选择图片"
            onClick={openUpload}
            className="bg-violet-800 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-violet-950"
          >
            开始检查
          </button>
        </nav>
      </div>
    </header>
  );
}

function ProductFooter() {
  return (
    <footer className="border-t border-violet-200 bg-white">
      <div className="mx-auto flex max-w-[1400px] flex-wrap justify-between gap-4 px-5 py-7 text-sm text-neutral-600 sm:px-8">
        <span className="font-semibold text-neutral-950">AI-PIC-DETECT</span>
        <span>发布前再看一眼，改不改由你决定。</span>
      </div>
    </footer>
  );
}

function DetailedReport({
  dimensions,
  issues,
  onSelectIssue,
}: {
  dimensions: ReviewResponse['dimensions'];
  issues: ReviewIssue[];
  onSelectIssue: (issueId: string) => void;
}) {
  return (
    <section
      data-testid="detailed-report"
      className="mt-6 overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-sm"
    >
      <div className="border-b border-violet-100 px-5 py-5 sm:px-6">
        <h2 className="text-lg font-semibold text-neutral-950">
          还检查了这些地方
        </h2>
        <p className="mt-1 text-xs leading-5 text-neutral-600">
          展开查看检查状态；有定位标记的项目可以回到原图。
        </p>
      </div>
      <div className="grid divide-y divide-violet-100 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        {(['A', 'B', 'C'] as const).map((group) => {
          const groupDimensions = ANALYSIS_DIMENSIONS.filter(
            (dimension) => dimension.group === group
          );

          return (
            <details
              key={group}
              open={dimensions.some(
                (dimension) =>
                  dimension.dim_id.startsWith(group) &&
                  dimension.state === 'review_recommended' &&
                  issues.some(
                    (issue) =>
                      issue.id === dimension.issue_id &&
                      issue.dim_id === dimension.dim_id &&
                      compatibleDimensions[issue.category].includes(
                        dimension.dim_id
                      )
                  )
              )}
              className="group"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-3.5 text-sm font-semibold text-neutral-950 marker:content-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:outline-none">
                <span>{dimensionGroupCopy[group]}</span>
                <span className="text-xs font-medium text-neutral-600">
                  {groupDimensions.length} 项
                </span>
              </summary>
              <ul className="border-t border-violet-100 px-3 py-2">
                {groupDimensions.map((definition) => {
                  const dimension = dimensions.find(
                    (item) => item.dim_id === definition.id
                  );
                  const linkedIssue =
                    dimension?.state === 'review_recommended' &&
                    dimension.issue_id
                      ? issues.find(
                          (issue) =>
                            issue.id === dimension.issue_id &&
                            issue.dim_id === definition.id &&
                            compatibleDimensions[issue.category].includes(
                              definition.id
                            )
                        )
                      : undefined;
                  const hasUnresolvedLink =
                    Boolean(dimension?.issue_id) ||
                    issues.some((issue) => issue.dim_id === definition.id);
                  const state = linkedIssue
                    ? 'review_recommended'
                    : dimension?.state === 'no_high_confidence_issue' &&
                        !hasUnresolvedLink
                      ? 'no_high_confidence_issue'
                      : 'not_assessable';
                  const row = (
                    <>
                      <span className="min-w-0">
                        <span className="block text-xs font-semibold text-neutral-950">
                          <span className="mr-2 font-normal text-neutral-500">
                            {definition.id}
                          </span>
                          <span data-dimension-label>
                            {dimensionLabelCopy[definition.id]}
                          </span>
                        </span>
                        <span className="mt-1 block text-[11px] leading-4 text-neutral-600">
                          {dimensionStateCopy[state]}
                        </span>
                      </span>
                      {linkedIssue ? (
                        <IconFocus2
                          aria-hidden="true"
                          size={16}
                          stroke={1.8}
                          className="shrink-0 text-violet-700"
                        />
                      ) : null}
                    </>
                  );

                  return (
                    <li key={definition.id}>
                      {linkedIssue ? (
                        <button
                          type="button"
                          aria-label={`定位维度 ${definition.id} ${dimensionLabelCopy[definition.id]}`}
                          onClick={() => onSelectIssue(linkedIssue.id)}
                          className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2.5 text-left transition hover:bg-violet-50 focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:outline-none"
                        >
                          {row}
                        </button>
                      ) : (
                        <div className="flex items-center justify-between gap-3 px-2 py-2.5">
                          {row}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </details>
          );
        })}
      </div>
    </section>
  );
}

function ResultWorkspace({
  previewUrl,
  response,
  selectedIssueId,
  decisions,
  onSelectIssue,
  onDecide,
  onNewImage,
}: {
  previewUrl: string | null;
  response: ReviewResponse;
  selectedIssueId: string | null;
  decisions: Record<string, IssueDecision>;
  onSelectIssue: (issueId: string) => void;
  onDecide: (issueId: string, decision: IssueDecision) => void;
  onNewImage: () => void;
}) {
  const orderedIssues = sortIssues(response.issues);
  const selectedIssue =
    orderedIssues.find((issue) => issue.id === selectedIssueId) ??
    orderedIssues[0] ??
    null;
  const allDecided =
    orderedIssues.length > 0 &&
    orderedIssues.every((issue) => decisions[issue.id]);
  if (response.status === 'no_issue' || !selectedIssue) {
    return (
      <main className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
            检查结果
          </h1>
          <button
            type="button"
            onClick={onNewImage}
            className="inline-flex items-center gap-2 rounded-lg border border-violet-300 px-4 py-2.5 text-sm font-semibold text-violet-900 transition hover:border-violet-700 hover:bg-violet-50"
          >
            <IconUpload size={17} stroke={1.8} />
            检查另一张图片
          </button>
        </div>
        <div
          data-testid="result-overview"
          className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_440px]"
        >
          <section
            data-testid="image-panel"
            className="self-start rounded-2xl border border-violet-200 bg-white p-3 shadow-sm sm:p-5"
          >
            <div className="mb-4 flex items-center justify-between gap-3 px-1">
              <p className="text-sm font-medium text-neutral-950">原图</p>
              <p className="text-xs text-neutral-600">当前没有局部定位</p>
            </div>
            <ImageStage
              previewUrl={previewUrl}
              issues={[]}
              selectedIssueId={null}
              onSelectIssue={onSelectIssue}
            />
          </section>
          <aside
            data-testid="issue-panel"
            className="order-first self-start lg:order-last"
          >
            <section className="rounded-2xl border border-violet-200 bg-white p-6 shadow-sm">
              <IconCircleCheck
                className="text-violet-700"
                size={36}
                stroke={1.5}
              />
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-balance text-neutral-950">
                这次没有发现足够明确的疑点
              </h2>
              <p className="mt-3 leading-7 text-neutral-600">
                没有找到值得单独标出来的局部。
              </p>
              <p className="mt-3 text-sm leading-6 text-neutral-600">
                这不代表图片一定没有问题。准备正式发布的话，也可以自己再看一眼手部、脸部和边缘细节。
              </p>
            </section>
          </aside>
        </div>
        <DetailedReport
          dimensions={response.dimensions}
          issues={orderedIssues}
          onSelectIssue={onSelectIssue}
        />
      </main>
    );
  }

  const selectedIssueIndex = orderedIssues.findIndex(
    (issue) => issue.id === selectedIssue.id
  );
  const nextIssue =
    orderedIssues[(selectedIssueIndex + 1) % orderedIssues.length];
  const hasNextIssue = orderedIssues.length > 1;
  const selectedDecision = decisions[selectedIssue.id];

  return (
    <main className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
          检查结果
        </h1>
        <button
          type="button"
          onClick={onNewImage}
          className="inline-flex items-center gap-2 rounded-lg border border-violet-300 px-4 py-2.5 text-sm font-semibold text-violet-900 transition hover:border-violet-700 hover:bg-violet-50"
        >
          <IconArrowLeft size={17} stroke={1.8} />
          换一张图片
        </button>
      </div>
      {allDecided ? (
        <section
          role="status"
          className="mb-6 flex flex-wrap items-center justify-between gap-5 rounded-xl border border-violet-200 bg-white p-5"
        >
          <div>
            <h2 className="text-xl font-semibold text-neutral-950">
              这次检查完成了
            </h2>
            <p className="mt-2 text-sm text-neutral-700">
              你已经看过全部疑点。
            </p>
            <p className="mt-1 text-sm leading-6 text-neutral-600">
              接下来可以按自己的判断处理，或者换一张图片继续检查。
            </p>
          </div>
          <button
            type="button"
            onClick={onNewImage}
            className="min-h-11 rounded-lg bg-violet-800 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-950"
          >
            检查另一张图片
          </button>
        </section>
      ) : null}
      <div
        data-testid="result-overview"
        className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_440px]"
      >
        <section
          data-testid="image-panel"
          className="self-start rounded-2xl border border-violet-200 bg-white p-3 shadow-sm sm:p-5"
        >
          <div className="mb-4 flex items-center justify-between gap-3 px-1">
            <p className="text-sm font-medium text-neutral-950">图片定位</p>
            <p className="text-xs text-neutral-600">
              点击编号或框选区域切换疑点
            </p>
          </div>
          <ImageStage
            previewUrl={previewUrl}
            issues={orderedIssues}
            selectedIssueId={selectedIssue.id}
            onSelectIssue={onSelectIssue}
          />
        </section>
        <aside data-testid="issue-panel" className="self-start">
          <section className="overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-sm">
            <div className="border-b border-violet-100 bg-violet-50 px-5 py-5">
              <p className="text-sm text-neutral-600">先看这几处</p>
              <p className="mt-2 text-xl leading-8 font-semibold text-neutral-950">
                发现 {response.summary.issue_count} 处值得看的疑点
              </p>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                逐个看看原因和修改方向，再决定是否确认。
              </p>
            </div>
            <div className="flex items-center justify-between border-b border-violet-100 px-5 py-4">
              <h2 className="font-semibold text-neutral-950">疑点列表</h2>
              <span className="text-xs text-neutral-600">
                {selectedIssueIndex + 1} / {orderedIssues.length}
              </span>
            </div>
            <ol className="max-h-56 divide-y divide-violet-100 overflow-y-auto overscroll-contain">
              {orderedIssues.map((issue, index) => {
                const isSelected = issue.id === selectedIssue.id;
                const decision = decisions[issue.id];
                return (
                  <li key={issue.id}>
                    <button
                      type="button"
                      aria-label={`疑点 ${index + 1}：${issue.title}`}
                      aria-pressed={isSelected}
                      onClick={() => onSelectIssue(issue.id)}
                      className={`flex w-full items-center gap-3 px-5 py-4 text-left transition focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:outline-none ${isSelected ? 'bg-violet-50' : 'hover:bg-violet-50/60'}`}
                    >
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-violet-800 text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold break-words text-neutral-950">
                          {issue.title}
                        </span>
                        <span className="mt-1 block text-xs text-neutral-600">
                          {priorityCopy[issue.priority]}
                          {decision === 'confirmed'
                            ? ' · 已确认'
                            : decision === 'excluded'
                              ? ' · 已排除'
                              : ''}
                        </span>
                      </span>
                      <IconChevronRight
                        size={17}
                        className="text-violet-500"
                        stroke={1.8}
                      />
                    </button>
                  </li>
                );
              })}
            </ol>
            <section className="border-t border-violet-200 px-5 py-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-violet-700">
                    这一处疑点 · {selectedIssueIndex + 1} /{' '}
                    {orderedIssues.length}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-neutral-950">
                    {selectedIssue.title}
                  </h2>
                  <p className="mt-1 text-sm text-neutral-600">
                    {categoryCopy[selectedIssue.category]}
                  </p>
                </div>
                <div className="rounded-lg bg-amber-50 px-3 py-2 text-right">
                  <p className="mt-0.5 text-xs font-semibold text-amber-950">
                    {priorityCopy[selectedIssue.priority]}
                  </p>
                </div>
              </div>
              <div className="mt-5 grid gap-4 border-t border-violet-100 pt-5 text-sm">
                <div>
                  <p className="font-semibold text-neutral-950">
                    为什么值得注意
                  </p>
                  <p className="mt-1.5 leading-6 text-neutral-600">
                    {selectedIssue.reason}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-neutral-950">可以怎么改</p>
                  <p className="mt-1.5 leading-6 text-neutral-600">
                    {selectedIssue.suggestion}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => nextIssue && onSelectIssue(nextIssue.id)}
                  disabled={!hasNextIssue}
                  className="order-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold text-violet-800 transition hover:bg-violet-50 disabled:text-neutral-500"
                >
                  <IconArrowRight size={17} stroke={2} />
                  看下一处
                </button>
                <button
                  type="button"
                  aria-pressed={selectedDecision === 'confirmed'}
                  onClick={() => onDecide(selectedIssue.id, 'confirmed')}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-violet-300 px-3 py-3 text-sm font-semibold text-violet-900 transition hover:bg-violet-50 aria-pressed:bg-violet-100"
                >
                  {selectedDecision === 'confirmed' ? '已确认疑点' : '确认疑点'}
                </button>
                <button
                  type="button"
                  aria-pressed={selectedDecision === 'excluded'}
                  onClick={() => onDecide(selectedIssue.id, 'excluded')}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-violet-300 px-3 py-3 text-sm font-semibold text-violet-900 transition hover:bg-violet-50 aria-pressed:bg-violet-100"
                >
                  {selectedDecision === 'excluded' ? '已排除疑点' : '排除疑点'}
                </button>
              </div>
            </section>
          </section>
        </aside>
      </div>
      <DetailedReport
        dimensions={response.dimensions}
        issues={orderedIssues}
        onSelectIssue={onSelectIssue}
      />
    </main>
  );
}

export function ReviewExperience({
  initialView = 'landing',
  analyzeImage = analyzeRealImage,
}: ReviewExperienceProps) {
  const [view, setView] = useState<ExperienceView>(initialView);
  const [status, setStatus] = useState<ReviewStatus>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [response, setResponse] = useState<ReviewResponse | null>(null);
  const [decisions, setDecisions] = useState<Record<string, IssueDecision>>({});
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analysisStartedAt, setAnalysisStartedAt] = useState<number | null>(
    null
  );
  const [analysisElapsed, setAnalysisElapsed] = useState(0);
  const requestVersion = useRef(0);
  const preparationTimer = useRef<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const analysisMessageIndex =
    Math.floor(analysisElapsed / 5) % waitingHints.length;
  const completed =
    Boolean(response?.issues.length) &&
    response?.issues.every((issue) => decisions[issue.id]);
  const [pendingSection, setPendingSection] = useState<
    'how-it-works' | 'why-this' | 'boundaries' | null
  >(null);
  const canStartAnalysis = selectedFile !== null && status === 'idle';
  const workspaceResponse = useMemo(
    () => (status === 'success' || status === 'no_issue' ? response : null),
    [response, status]
  );

  useEffect(() => () => revokePreviewUrl(previewUrl), [previewUrl]);
  useEffect(
    () => () => {
      requestVersion.current += 1;
      if (preparationTimer.current !== null)
        window.clearTimeout(preparationTimer.current);
    },
    []
  );

  useEffect(() => {
    if (pendingSection) return;
    const heading = contentRef.current?.querySelector('h1');
    if (!heading) return;
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
    contentRef.current?.scrollIntoView?.({
      block: 'start',
      behavior: 'instant',
    });
  }, [view, status, completed, pendingSection]);

  useEffect(() => {
    if (view !== 'landing' || !pendingSection) return;

    const frameId = window.requestAnimationFrame(() => {
      const target = document.getElementById(pendingSection);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.replaceState(null, '', `#${pendingSection}`);
      setPendingSection(null);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [pendingSection, view]);

  function openUpload() {
    startAnotherReview();
  }
  function showLanding() {
    requestVersion.current += 1;
    setView('landing');
    setStatus('idle');
    setResponse(null);
    setSelectedIssueId(null);
    setDecisions({});
    setErrorMessage(null);
  }
  function navigateToSection(
    sectionId: 'how-it-works' | 'why-this' | 'boundaries'
  ) {
    showLanding();
    setPendingSection(sectionId);
  }
  function startAnotherReview() {
    requestVersion.current += 1;
    if (preparationTimer.current !== null)
      window.clearTimeout(preparationTimer.current);
    setPreviewUrl(null);
    setPendingSection(null);
    setView('upload');
    setStatus('idle');
    setSelectedFile(null);
    setResponse(null);
    setSelectedIssueId(null);
    setDecisions({});
    setErrorMessage(null);
  }
  function selectFile(file: File | undefined) {
    if (!file) return;
    requestVersion.current += 1;
    if (preparationTimer.current !== null)
      window.clearTimeout(preparationTimer.current);
    setResponse(null);
    setDecisions({});
    setSelectedIssueId(null);
    setPreviewUrl(null);
    const validation = validateReviewImageFile(file);
    if (!validation.valid) {
      setStatus('unsupported');
      setErrorMessage(validation.error);
      setSelectedFile(null);
      return;
    }
    setStatus('uploading');
    setErrorMessage(null);
    setSelectedFile(file);
    setResponse(null);
    setSelectedIssueId(null);
    setPreviewUrl(createPreviewUrl(file));
    preparationTimer.current = window.setTimeout(() => setStatus('idle'), 120);
  }
  function onInputChange(event: ChangeEvent<HTMLInputElement>) {
    selectFile(event.target.files?.[0]);
    event.target.value = '';
  }
  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    selectFile(event.dataTransfer.files?.[0]);
  }
  async function startAnalysis() {
    if (!selectedFile || status === 'analysing') return;
    const version = ++requestVersion.current;
    setStatus('analysing');
    setAnalysisStartedAt(Date.now());
    setAnalysisElapsed(0);
    setDecisions({});
    setResponse(null);
    setErrorMessage(null);
    setView('workspace');
    try {
      const nextResponse = await withTimeout(
        analyzeImage(selectedFile),
        ANALYSIS_TIMEOUT_MS
      );
      if (version !== requestVersion.current) return;
      setResponse(nextResponse);
      setSelectedIssueId(sortIssues(nextResponse.issues)[0]?.id ?? null);
      setStatus(nextResponse.status);
    } catch (error) {
      if (version !== requestVersion.current) return;
      const quotaExhausted =
        error instanceof Error && error.message === 'quota_exhausted';
      const timedOut =
        error instanceof Error && error.message === 'analysis_timeout';
      const unsupported =
        error instanceof Error && error.message === 'unsupported';

      if (unsupported) {
        setView('upload');
        setStatus('unsupported');
        setSelectedFile(null);
        setResponse(null);
        setSelectedIssueId(null);
        setPreviewUrl(null);
        setErrorMessage(
          '这张图片无法读取或不符合上传要求。请重新导出为 PNG、JPG 或 WebP 后再试。'
        );
        return;
      }

      setStatus(
        quotaExhausted
          ? 'quota_exhausted'
          : timedOut
            ? 'timeout'
            : 'analysis_failed'
      );
      setErrorMessage(
        quotaExhausted
          ? '游客体验次数或账户检查额度已用完。购买入口开放后可继续检查。'
          : timedOut
            ? '等待时间过长，这次检查已停止。可以再试一次，或者换一张图片。'
            : '刚才没有拿到完整结果，可以再试一次，或者换一张图片。'
      );
    }
  }
  useEffect(() => {
    if (status !== 'analysing' || analysisStartedAt === null) return;
    const timer = window.setInterval(() => {
      setAnalysisElapsed(Math.floor((Date.now() - analysisStartedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [analysisStartedAt, status]);

  function handleDecision(issueId: string, decision: IssueDecision) {
    setDecisions((current) => ({ ...current, [issueId]: decision }));
  }

  const page = workspaceResponse ? (
    <ResultWorkspace
      previewUrl={previewUrl}
      response={workspaceResponse}
      selectedIssueId={selectedIssueId}
      decisions={decisions}
      onSelectIssue={setSelectedIssueId}
      onDecide={handleDecision}
      onNewImage={startAnotherReview}
    />
  ) : view === 'workspace' && status === 'analysing' ? (
    <main className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
      <div className="grid min-h-[65dvh] gap-8 rounded-2xl border border-violet-200 bg-white p-5 shadow-sm md:grid-cols-[minmax(0,0.9fr)_minmax(260px,0.7fr)] md:p-8">
        <ImageStage
          previewUrl={previewUrl}
          issues={[]}
          selectedIssueId={null}
          onSelectIssue={() => undefined}
        />
        <div className="flex flex-col justify-center">
          <IconLoader2
            className="animate-spin text-violet-700 motion-reduce:animate-none"
            size={34}
            stroke={1.7}
          />
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-neutral-950">
            正在检查容易被忽略的细节
          </h1>
          <p className="mt-4 min-h-21 max-w-md leading-7 text-neutral-600">
            {waitingHints[analysisMessageIndex]}
          </p>
          <p
            role="timer"
            className="mt-6 text-sm font-medium text-neutral-700 tabular-nums"
          >
            {analysisElapsed < 60
              ? `已等待 ${analysisElapsed} 秒`
              : `已等待 ${Math.floor(analysisElapsed / 60)} 分 ${analysisElapsed % 60} 秒`}
          </p>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            完成后会直接显示检查结果。
          </p>
        </div>
      </div>
    </main>
  ) : view === 'workspace' && status === 'quota_exhausted' ? (
    <main className="mx-auto max-w-4xl px-5 py-14 sm:px-8">
      <div className="grid min-h-[50dvh] place-items-center rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-xl shadow-amber-950/5">
        <div className="max-w-md space-y-5">
          <IconAlertCircle
            className="mx-auto text-amber-700"
            size={42}
            stroke={1.5}
          />
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
            本次检查额度已用完
          </h1>
          <p className="leading-7 text-neutral-600">{errorMessage}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/zh/pricing"
              className="inline-flex items-center gap-2 bg-violet-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-950"
            >
              查看额度包
              <IconArrowRight size={17} stroke={1.8} />
            </Link>
            <button
              type="button"
              onClick={startAnotherReview}
              className="inline-flex items-center gap-2 border border-violet-300 px-5 py-3 text-sm font-semibold text-violet-900 transition hover:bg-white"
            >
              换一张图片
            </button>
          </div>
        </div>
      </div>
    </main>
  ) : view === 'workspace' &&
    (status === 'timeout' || status === 'analysis_failed') ? (
    <main className="mx-auto max-w-4xl px-5 py-14 sm:px-8">
      <div className="grid min-h-[50dvh] place-items-center rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-xl shadow-amber-950/5">
        <div className="max-w-md space-y-5">
          <IconAlertCircle
            className="mx-auto text-amber-700"
            size={42}
            stroke={1.5}
          />
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
            {status === 'timeout'
              ? '等待时间较长，这次检查未完成'
              : '这次检查没有完成'}
          </h1>
          <p className="leading-7 text-neutral-600">{errorMessage}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={startAnalysis}
              className="inline-flex items-center gap-2 bg-violet-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-950"
            >
              <IconRefresh size={17} stroke={1.8} />
              再试一次
            </button>
            <button
              type="button"
              onClick={startAnotherReview}
              className="inline-flex items-center gap-2 border border-violet-300 px-5 py-3 text-sm font-semibold text-violet-900 transition hover:bg-white"
            >
              换一张图片
            </button>
          </div>
        </div>
      </div>
    </main>
  ) : view === 'upload' ? (
    <main id="upload" className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={showLanding}
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-violet-800 hover:text-neutral-950"
        >
          <IconArrowLeft size={17} stroke={1.8} />
          返回说明
        </button>
        <h1 className="text-4xl font-semibold tracking-tight text-neutral-950 sm:text-5xl">
          上传一张 AI 图
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-neutral-600">
          支持 PNG、JPG 和 WebP，单张不超过 10MB。
        </p>
        <div
          role="button"
          tabIndex={0}
          aria-label="拖放要检查的图片"
          onDragOver={(event) => event.preventDefault()}
          onDrop={onDrop}
          onClick={(event) => {
            if (
              !(event.target instanceof HTMLElement) ||
              event.target.closest('label, input')
            )
              return;
            document.getElementById('review-image-input')?.click();
          }}
          onKeyDown={(event) => {
            if (
              event.target === event.currentTarget &&
              (event.key === 'Enter' || event.key === ' ')
            ) {
              event.preventDefault();
              document.getElementById('review-image-input')?.click();
            }
          }}
          className="mt-9 border-2 border-dashed border-violet-300 bg-violet-50/70 p-5 transition hover:border-violet-700 hover:bg-violet-50 sm:p-8"
        >
          {previewUrl && selectedFile ? (
            <div className="grid gap-6 sm:grid-cols-[180px_1fr] sm:items-center">
              <img
                src={previewUrl}
                alt="待检查图片预览"
                className="aspect-square w-full border border-violet-200 bg-white object-contain sm:size-[180px]"
              />
              <div>
                <p className="font-semibold break-all text-neutral-950">
                  {selectedFile.name}
                </p>
                <p className="mt-1 text-sm text-neutral-600">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB ·
                  可以开始检查了
                </p>
                <label
                  htmlFor="review-image-input"
                  className="mt-5 inline-flex cursor-pointer items-center gap-2 border border-violet-300 bg-white px-4 py-2.5 text-sm font-semibold text-violet-900 transition hover:border-violet-700"
                >
                  <IconRefresh size={17} stroke={1.8} />
                  更换图片
                </label>
              </div>
            </div>
          ) : (
            <div className="grid place-items-center py-8 text-center">
              <span className="grid size-14 place-items-center rounded-full bg-white text-violet-800 shadow-sm">
                <IconUpload size={25} stroke={1.6} />
              </span>
              <p className="mt-4 font-semibold text-neutral-950">
                把图片拖到这里
              </p>
              <p className="mt-1 text-sm text-neutral-600">
                或从设备中选择一张图片
              </p>
              <label
                htmlFor="review-image-input"
                className="mt-5 inline-flex cursor-pointer items-center gap-2 bg-violet-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-950"
              >
                <IconUpload size={17} stroke={1.8} />
                选择图片
              </label>
            </div>
          )}
          <input
            id="review-image-input"
            aria-label="选择要检查的图片"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={onInputChange}
          />
        </div>
        {status === 'uploading' ? (
          <p aria-live="polite" className="mt-4 text-sm text-violet-700">
            正在准备图片预览…
          </p>
        ) : null}
        {status === 'unsupported' && errorMessage ? (
          <section
            aria-live="polite"
            role="alert"
            className="mt-4 flex gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 text-rose-800"
          >
            <IconAlertCircle
              className="mt-0.5 shrink-0"
              size={18}
              stroke={1.8}
            />
            <div>
              <h2 className="font-semibold">无法使用这张图片</h2>
              <p className="mt-1 text-sm leading-6">{errorMessage}</p>
              <p className="mt-1 text-sm leading-6 text-rose-800/75">
                请选择 PNG、JPG 或 WebP，且文件不超过 10MB。
              </p>
            </div>
          </section>
        ) : null}
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button
            type="button"
            disabled={!canStartAnalysis}
            onClick={startAnalysis}
            className="inline-flex items-center gap-2 bg-violet-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-950 disabled:cursor-not-allowed disabled:bg-violet-300"
          >
            开始检查
            <IconArrowRight size={17} stroke={1.8} />
          </button>
          <p className="text-sm text-neutral-600">
            先找出疑点，改不改由你决定。
          </p>
        </div>
      </div>
    </main>
  ) : (
    <LandingPage onUpload={openUpload} />
  );

  return (
    <>
      <ProductHeader
        openUpload={openUpload}
        showLanding={showLanding}
        navigateToSection={navigateToSection}
      />
      <div
        ref={contentRef}
        className="min-h-screen scroll-mt-16 bg-[#faf9f6] pt-16"
      >
        {page}
        <ProductFooter />
      </div>
    </>
  );
}
