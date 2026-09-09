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
  IconX,
} from '@tabler/icons-react';

import { getContainedImageFrame } from './bbox';
import { analyzeMockImage } from './mock';
import type {
  IssueDecision,
  ReviewIssue,
  ReviewResponse,
  ReviewStatus,
} from './types';
import { validateReviewImageFile } from './validation';

const ANALYSIS_TIMEOUT_MS = 12_000;

type ReviewExperienceProps = {
  initialView?: 'landing' | 'upload';
  analyzeImage?: (file: File) => Promise<ReviewResponse>;
};

type ExperienceView = 'landing' | 'upload' | 'workspace';

const priorityCopy = {
  high: '高修改优先级',
  medium: '中修改优先级',
  low: '低修改优先级',
} as const;

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
  review_recommended: '建议检查',
  no_high_confidence_issue: '当前未见高置信度问题',
  not_assessable: '当前不可判断',
} as const;

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

function HeroReviewExample() {
  return (
    <figure className="space-y-3">
      <figcaption className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-violet-950">初看完整</span>
        <span className="text-violet-950/60">扫描后定位 2 个局部</span>
      </figcaption>
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-violet-200 bg-violet-50">
        <ReferenceImage alt="示例二次元人物图，扫描后标记两个建议复核的局部" />
        <div className="absolute inset-y-0 right-0 w-[48%] border-l border-dashed border-white/80 bg-violet-950/8" />
        {[
          { number: 1, className: 'top-[44%] left-[58%] h-[18%] w-[23%]' },
          { number: 2, className: 'top-[18%] left-[28%] h-[16%] w-[38%]' },
        ].map((marker) => (
          <div
            key={marker.number}
            className={`absolute border-2 border-amber-400 bg-amber-200/10 ${marker.className}`}
          >
            <span className="absolute -top-3 -left-3 grid size-6 place-items-center rounded-full bg-amber-400 text-xs font-bold text-violet-950">
              {marker.number}
            </span>
          </div>
        ))}
        <div className="absolute right-4 bottom-4 inline-flex items-center gap-2 rounded-full bg-violet-950 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-violet-950/20">
          <IconFocus2 size={15} stroke={1.8} />
          值得复核
        </div>
      </div>
    </figure>
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

  const markers = issues.map((issue, index) => {
    const isSelected = issue.id === selectedIssueId;
    return (
      <button
        key={issue.id}
        type="button"
        aria-label={`定位问题 ${index + 1}`}
        aria-pressed={isSelected}
        onClick={() => onSelectIssue(issue.id)}
        className={`absolute border-2 text-left transition focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:outline-none ${
          isSelected
            ? 'z-10 border-amber-400 bg-amber-300/15'
            : 'border-violet-500/80 bg-violet-400/10 hover:border-amber-400'
        }`}
        style={{
          left: `${issue.bbox.x * 100}%`,
          top: `${issue.bbox.y * 100}%`,
          width: `${issue.bbox.width * 100}%`,
          height: `${issue.bbox.height * 100}%`,
        }}
      >
        <span
          className={`absolute -top-3 -left-3 grid size-6 place-items-center rounded-full text-xs font-bold ${
            isSelected
              ? 'bg-amber-400 text-violet-950'
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
      className="relative isolate aspect-[4/5] overflow-hidden border border-violet-200 bg-[#f6f3ff]"
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
            className="size-full object-fill"
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
        <div className="absolute right-4 bottom-4 flex items-center gap-2 border border-violet-200 bg-white/90 px-3 py-2 text-xs font-medium text-violet-950 backdrop-blur">
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
  navigateToSection: (sectionId: 'how-it-works' | 'boundaries') => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-violet-100 bg-[#fdfcff]/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 sm:px-8">
        <button
          type="button"
          onClick={showLanding}
          className="text-sm font-bold tracking-[-0.04em] text-violet-950"
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
            className="hidden hover:text-violet-950 sm:block"
          >
            使用流程
          </a>
          <a
            href="#boundaries"
            onClick={(event) => {
              event.preventDefault();
              navigateToSection('boundaries');
            }}
            className="hidden hover:text-violet-950 sm:block"
          >
            产品边界
          </a>
          <Link
            href="/pricing"
            className="hidden hover:text-violet-950 lg:block"
          >
            购买额度
          </Link>
          <Link
            href="/reviews"
            className="hidden hover:text-violet-950 xl:block"
          >
            检查记录
          </Link>
          <Link
            href="/sign-in?callbackUrl=/reviews"
            className="hidden hover:text-violet-950 sm:block"
          >
            登录
          </Link>
          <button
            type="button"
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
      <div className="mx-auto flex max-w-[1400px] flex-wrap justify-between gap-4 px-5 py-7 text-sm text-violet-950/60 sm:px-8">
        <span className="font-semibold text-violet-950">AI-PIC-DETECT</span>
        <span>为创作复核提供局部提示。</span>
      </div>
    </footer>
  );
}

function DimensionPanel({
  dimensions,
  issues,
  onSelectIssue,
}: {
  dimensions: ReviewResponse['dimensions'];
  issues: ReviewIssue[];
  onSelectIssue: (issueId: string) => void;
}) {
  return (
    <section className="mt-5 overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-xl shadow-violet-950/5">
      <div className="border-b border-violet-100 px-5 py-4">
        <h2 className="font-semibold text-violet-950">检查维度</h2>
        <p className="mt-1 text-xs leading-5 text-violet-950/60">
          这是检查状态，不是错误清单；仅有合法定位的项目可跳转原图。
        </p>
      </div>
      <div className="divide-y divide-violet-100">
        {(['A', 'B', 'C'] as const).map((group) => {
          const groupDimensions = ANALYSIS_DIMENSIONS.filter(
            (dimension) => dimension.group === group
          );

          return (
            <details key={group} open={group === 'B'} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-3.5 text-sm font-semibold text-violet-950 marker:content-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:outline-none">
                <span>{dimensionGroupCopy[group]}</span>
                <span className="text-xs font-medium text-violet-950/55">
                  {groupDimensions.length} 项
                </span>
              </summary>
              <ul className="border-t border-violet-100 px-3 py-2">
                {groupDimensions.map((definition) => {
                  const dimension = dimensions.find(
                    (item) => item.dim_id === definition.id
                  );
                  const linkedIssue = dimension?.issue_id
                    ? issues.find((issue) => issue.id === dimension.issue_id)
                    : undefined;
                  const row = (
                    <>
                      <span className="min-w-0">
                        <span className="block text-xs font-semibold text-violet-950">
                          {definition.id} {dimensionLabelCopy[definition.id]}
                        </span>
                        <span className="mt-1 block text-[11px] leading-4 text-violet-950/60">
                          {
                            dimensionStateCopy[
                              dimension?.state ?? 'not_assessable'
                            ]
                          }
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
  const selectedIssue =
    response.issues.find((issue) => issue.id === selectedIssueId) ??
    response.issues[0] ??
    null;
  if (response.status === 'no_issue' || !selectedIssue) {
    return (
      <main className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-3xl font-semibold tracking-tight text-violet-950">
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
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_440px]">
          <section className="rounded-2xl border border-violet-200 bg-white p-3 shadow-xl shadow-violet-950/5 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3 px-1">
              <p className="text-sm font-medium text-violet-950">原图</p>
              <p className="text-xs text-violet-950/60">当前没有局部定位</p>
            </div>
            <ImageStage
              previewUrl={previewUrl}
              issues={[]}
              selectedIssueId={null}
              onSelectIssue={onSelectIssue}
            />
          </section>
          <aside>
            <section className="rounded-2xl border border-violet-200 bg-white p-6 shadow-xl shadow-violet-950/5">
              <IconCircleCheck
                className="text-violet-700"
                size={36}
                stroke={1.5}
              />
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-violet-950">
                暂未发现高修改优先级问题
              </h2>
              <p className="mt-3 leading-7 text-violet-950/70">
                本次扫描未给出需要优先修改的局部。
              </p>
              <p className="mt-3 text-sm leading-6 text-violet-950/55">
                仍可按作品用途复核脸部、手部与边缘细节。
              </p>
            </section>
            <DimensionPanel
              dimensions={response.dimensions}
              issues={response.issues}
              onSelectIssue={onSelectIssue}
            />
          </aside>
        </div>
      </main>
    );
  }

  const selectedIssueIndex = response.issues.findIndex(
    (issue) => issue.id === selectedIssue.id
  );
  const nextIssue =
    response.issues[(selectedIssueIndex + 1) % response.issues.length];
  const hasNextIssue = response.issues.length > 1;
  const nextIssueLabel =
    selectedIssueIndex === response.issues.length - 1 ? '回到第一项' : '下一项';

  const selectedDecision = decisions[selectedIssue.id];
  return (
    <main className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight text-violet-950">
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
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_440px]">
        <section className="rounded-2xl border border-violet-200 bg-white p-3 shadow-xl shadow-violet-950/5 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3 px-1">
            <p className="text-sm font-medium text-violet-950">图片定位</p>
            <p className="text-xs text-violet-950/60">
              点击编号或框选区域切换问题
            </p>
          </div>
          <ImageStage
            previewUrl={previewUrl}
            issues={response.issues}
            selectedIssueId={selectedIssue.id}
            onSelectIssue={onSelectIssue}
          />
        </section>
        <aside>
          <section className="overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-xl shadow-violet-950/5">
            <div className="border-b border-violet-100 bg-violet-50 px-5 py-5">
              <p className="text-sm font-semibold text-violet-950">整体摘要</p>
              <p className="mt-2 text-sm leading-6 text-violet-950/70">
                发现 {response.summary.issue_count} 个建议复核的局部，其中{' '}
                {response.summary.high_priority_count} 个为高修改优先级。
              </p>
            </div>
            <div className="flex items-center justify-between border-b border-violet-100 px-5 py-4">
              <h2 className="font-semibold text-violet-950">问题列表</h2>
              <span className="text-xs text-violet-950/55">
                {selectedIssueIndex + 1} / {response.issues.length}
              </span>
            </div>
            <ol className="divide-y divide-violet-100">
              {response.issues.map((issue, index) => {
                const isSelected = issue.id === selectedIssue.id;
                const decision = decisions[issue.id];
                return (
                  <li key={issue.id}>
                    <button
                      type="button"
                      aria-label={`问题 ${index + 1}：${issue.title}`}
                      aria-pressed={isSelected}
                      onClick={() => onSelectIssue(issue.id)}
                      className={`flex w-full items-center gap-3 px-5 py-4 text-left transition focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:outline-none ${isSelected ? 'bg-violet-50' : 'hover:bg-violet-50/60'}`}
                    >
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-violet-800 text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-violet-950">
                          {issue.title}
                        </span>
                        <span className="mt-1 block text-xs text-violet-950/60">
                          {priorityCopy[issue.priority]}
                          {decision === 'ignored' ? ' · 已忽略' : ''}
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
                    当前问题 · {selectedIssueIndex + 1} /{' '}
                    {response.issues.length}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-violet-950">
                    {selectedIssue.title}
                  </h2>
                  <p className="mt-1 text-sm text-violet-950/60">
                    {categoryCopy[selectedIssue.category]}
                  </p>
                </div>
                <div className="rounded-lg bg-amber-50 px-3 py-2 text-right">
                  <p className="text-[11px] font-medium text-amber-900/70">
                    修改优先级
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-amber-950">
                    {priorityCopy[selectedIssue.priority]}
                  </p>
                </div>
              </div>
              <div className="mt-5 grid gap-4 border-t border-violet-100 pt-5 text-sm">
                <div>
                  <p className="font-semibold text-violet-950">检查原因</p>
                  <p className="mt-1.5 leading-6 text-violet-950/70">
                    {selectedIssue.reason}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-violet-950">修改建议</p>
                  <p className="mt-1.5 leading-6 text-violet-950/70">
                    {selectedIssue.suggestion}
                  </p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => nextIssue && onSelectIssue(nextIssue.id)}
                  disabled={!hasNextIssue}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-800 px-3 py-3 text-sm font-semibold text-white transition hover:bg-violet-950 disabled:cursor-default disabled:bg-violet-300"
                >
                  <IconArrowRight size={17} stroke={2} />
                  {hasNextIssue ? nextIssueLabel : '暂无下一项'}
                </button>
                <button
                  type="button"
                  onClick={() => onDecide(selectedIssue.id, 'ignored')}
                  disabled={selectedDecision === 'ignored'}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-violet-300 px-3 py-3 text-sm font-semibold text-violet-900 transition hover:border-violet-700 hover:bg-violet-50 disabled:cursor-default disabled:border-violet-100 disabled:text-violet-300"
                >
                  <IconX size={17} stroke={2} />
                  {selectedDecision === 'ignored' ? '已忽略' : '忽略此项'}
                </button>
              </div>
            </section>
          </section>
          <DimensionPanel
            dimensions={response.dimensions}
            issues={response.issues}
            onSelectIssue={onSelectIssue}
          />
        </aside>
      </div>
    </main>
  );
}

export function ReviewExperience({
  initialView = 'landing',
  analyzeImage = analyzeMockImage,
}: ReviewExperienceProps) {
  const [view, setView] = useState<ExperienceView>(initialView);
  const [status, setStatus] = useState<ReviewStatus>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [response, setResponse] = useState<ReviewResponse | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<Record<string, IssueDecision>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingSection, setPendingSection] = useState<
    'how-it-works' | 'boundaries' | null
  >(null);
  const canStartAnalysis = selectedFile !== null && status === 'idle';
  const workspaceResponse = useMemo(
    () => (status === 'success' || status === 'no_issue' ? response : null),
    [response, status]
  );

  useEffect(() => () => revokePreviewUrl(previewUrl), [previewUrl]);

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
    setView('upload');
    setStatus('idle');
    setErrorMessage(null);
  }
  function showLanding() {
    setView('landing');
    setStatus('idle');
    setResponse(null);
    setSelectedIssueId(null);
    setErrorMessage(null);
  }
  function navigateToSection(sectionId: 'how-it-works' | 'boundaries') {
    showLanding();
    setPendingSection(sectionId);
  }
  function startAnotherReview() {
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
    setDecisions({});
    setSelectedIssueId(null);
    setPreviewUrl((currentUrl) => {
      revokePreviewUrl(currentUrl);
      return createPreviewUrl(file);
    });
    window.setTimeout(() => setStatus('idle'), 120);
  }
  function onInputChange(event: ChangeEvent<HTMLInputElement>) {
    selectFile(event.target.files?.[0]);
  }
  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    selectFile(event.dataTransfer.files?.[0]);
  }
  async function startAnalysis() {
    if (!selectedFile) return;
    setStatus('analysing');
    setErrorMessage(null);
    setView('workspace');
    try {
      const nextResponse = await withTimeout(
        analyzeImage(selectedFile),
        ANALYSIS_TIMEOUT_MS
      );
      setResponse(nextResponse);
      setSelectedIssueId(nextResponse.issues[0]?.id ?? null);
      setStatus(nextResponse.status);
    } catch (error) {
      const quotaExhausted =
        error instanceof Error && error.message === 'quota_exhausted';
      const timedOut =
        error instanceof Error && error.message === 'analysis_timeout';
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
            ? '分析时间较长，暂未完成。请重试，或重新选择一张图片。'
            : '分析暂时没有返回结果，请稍后重试。'
      );
    }
  }
  function decideIssue(issueId: string, decision: IssueDecision) {
    setDecisions((current) => ({ ...current, [issueId]: decision }));
  }

  const page = workspaceResponse ? (
    <ResultWorkspace
      previewUrl={previewUrl}
      response={workspaceResponse}
      selectedIssueId={selectedIssueId}
      decisions={decisions}
      onSelectIssue={setSelectedIssueId}
      onDecide={decideIssue}
      onNewImage={startAnotherReview}
    />
  ) : view === 'workspace' && status === 'analysing' ? (
    <main className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
      <div className="grid min-h-[65dvh] gap-8 rounded-2xl border border-violet-200 bg-white p-5 shadow-xl shadow-violet-950/5 md:grid-cols-[minmax(0,0.9fr)_minmax(260px,0.7fr)] md:p-8">
        <ImageStage
          previewUrl={previewUrl}
          issues={[]}
          selectedIssueId={null}
          onSelectIssue={() => undefined}
        />
        <div className="flex flex-col justify-center">
          <IconLoader2
            className="animate-spin text-violet-700"
            size={34}
            stroke={1.7}
          />
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-violet-950">
            正在扫描局部细节
          </h1>
          <p className="mt-4 max-w-md leading-7 text-violet-950/70">
            正在筛选值得人工复核的区域，并整理修改建议。
          </p>
          <p className="mt-8 text-sm text-violet-950/55">
            请保持此页面开启，完成后会显示结果。
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
          <h1 className="text-3xl font-semibold tracking-tight text-violet-950">
            本次检查额度已用完
          </h1>
          <p className="leading-7 text-violet-950/70">{errorMessage}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/pricing"
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
              重新选择图片
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
          <h1 className="text-3xl font-semibold tracking-tight text-violet-950">
            {status === 'timeout'
              ? '分析时间较长，暂未完成'
              : '这次分析没有完成'}
          </h1>
          <p className="leading-7 text-violet-950/70">
            {errorMessage ?? '请重试，或重新选择一张图片。'}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={startAnalysis}
              className="inline-flex items-center gap-2 bg-violet-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-950"
            >
              <IconRefresh size={17} stroke={1.8} />
              重试分析
            </button>
            <button
              type="button"
              onClick={startAnotherReview}
              className="inline-flex items-center gap-2 border border-violet-300 px-5 py-3 text-sm font-semibold text-violet-900 transition hover:bg-white"
            >
              重新选择图片
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
          onClick={() => setView('landing')}
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-violet-800 hover:text-violet-950"
        >
          <IconArrowLeft size={17} stroke={1.8} />
          返回说明
        </button>
        <h1 className="text-4xl font-semibold tracking-tight text-violet-950 sm:text-5xl">
          上传一张人物图
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-violet-950/70">
          支持 PNG、JPG 和 WebP，单张不超过 10MB。图片只用于本次检查流程。
        </p>
        <div
          role="button"
          tabIndex={0}
          aria-label="拖放要检查的图片"
          onDragOver={(event) => event.preventDefault()}
          onDrop={onDrop}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ')
              document.getElementById('review-image-input')?.click();
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
                <p className="font-semibold text-violet-950">
                  {selectedFile.name}
                </p>
                <p className="mt-1 text-sm text-violet-950/60">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB ·
                  已准备好检查
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
              <p className="mt-4 font-semibold text-violet-950">
                拖放图片到这里
              </p>
              <p className="mt-1 text-sm text-violet-950/60">
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
            开始分析
            <IconArrowRight size={17} stroke={1.8} />
          </button>
          <p className="text-sm text-violet-950/55">本次只生成局部复核建议。</p>
        </div>
      </div>
    </main>
  ) : (
    <main className="overflow-hidden bg-[#fdfcff] text-violet-950">
      <section className="mx-auto grid max-w-[1280px] gap-12 px-5 pt-16 pb-20 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.72fr)] lg:items-center lg:pt-24 lg:pb-28">
        <div>
          <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.04em] text-violet-950 sm:text-6xl lg:text-7xl">
            发布前，先把局部问题看清楚。
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-violet-950/70">
            上传一张人物图。扫描会定位值得复核的局部，说明检查原因，并给出可执行的修改建议。
          </p>
          <p className="mt-3 text-sm leading-6 text-violet-950/55">
            游客可直接体验 1 次检查；登录后可管理检查额度与保存记录。
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={openUpload}
              className="inline-flex items-center gap-2 bg-violet-800 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-violet-950"
            >
              <IconUpload size={18} stroke={1.8} />
              上传图片开始检查
            </button>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 px-2 py-3 text-sm font-semibold text-violet-800 hover:text-violet-950"
            >
              了解流程
              <IconArrowRight size={17} stroke={1.8} />
            </a>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-violet-950/65">
            <span className="inline-flex items-center gap-2">
              <IconFocus2 size={17} stroke={1.7} />
              局部定位
            </span>
            <span className="inline-flex items-center gap-2">
              <IconCircleCheck size={17} stroke={1.7} />
              人工复核
            </span>
          </div>
        </div>
        <div className="mx-auto w-full max-w-[430px] lg:justify-self-end">
          <HeroReviewExample />
        </div>
      </section>
      <section
        id="how-it-works"
        className="border-y border-violet-200 bg-violet-50/70"
      >
        <div className="mx-auto max-w-[1400px] px-5 py-18 sm:px-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              从图片到可执行的修改建议
            </h2>
          </div>
          <ol className="mt-10 grid gap-0 border-t border-violet-200 md:grid-cols-3">
            {[
              [
                '01',
                '上传一张人物图',
                '选择 PNG、JPG 或 WebP，先完成基础校验。',
              ],
              [
                '02',
                '定位值得检查的区域',
                '只呈现通过内部置信度过滤的候选问题。',
              ],
              [
                '03',
                '查看建议并决定下一步',
                '逐项查看原因与建议，继续下一项或忽略。',
              ],
            ].map(([number, title, description]) => (
              <li
                key={number}
                className="border-b border-violet-200 py-6 md:border-r md:px-6 md:first:pl-0 md:last:border-r-0"
              >
                <span className="text-sm font-semibold text-violet-700">
                  {number}
                </span>
                <h3 className="mt-6 text-lg font-semibold">{title}</h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-violet-950/65">
                  {description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section
        id="boundaries"
        className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8"
      >
        <div className="grid gap-8 rounded-2xl border border-violet-200 bg-white p-6 shadow-xl shadow-violet-950/5 sm:p-8 md:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">
              帮助你判断“哪里值得再看”
            </h2>
          </div>
          <div className="text-sm leading-7 text-violet-950/70">
            <p>
              扫描只给出局部复核提示，不替你自动修改图片。最终修改由创作者决定。
            </p>
          </div>
        </div>
      </section>
    </main>
  );

  return (
    <>
      <ProductHeader
        openUpload={openUpload}
        showLanding={showLanding}
        navigateToSection={navigateToSection}
      />
      {page}
      <ProductFooter />
    </>
  );
}
