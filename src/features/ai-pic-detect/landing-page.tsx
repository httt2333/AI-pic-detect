'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { IconArrowRight, IconEye, IconUpload } from '@tabler/icons-react';

import { getMockAnalysisResponse } from './mock';

type LandingPageProps = {
  onUpload: () => void;
};

const storySteps = [
  {
    key: 'find',
    label: 'FIND',
    title: '找出你自己漏看的地方',
    description: '第一眼没发现的问题，放大后可能就是最容易暴露生成感的细节。',
  },
  {
    key: 'understand',
    label: 'UNDERSTAND',
    title: '知道它到底怪在哪里',
    description:
      '不只标出位置，还说明它和结构、边界、遮挡或局部细节有什么关系。',
  },
  {
    key: 'fix',
    label: 'FIX',
    title: '把“怪怪的”变成具体修改动作',
    description:
      '告诉你应该检查什么、调整什么，以及哪些已经满意的部分应该保持不动。',
  },
] as const;

type StoryStep = (typeof storySteps)[number]['key'];

function ReviewImage({
  alt,
  className = '',
}: {
  alt: string;
  className?: string;
}) {
  return (
    <Image
      src="/images/ai-pic-detect/hero-review-sample.png"
      alt={alt}
      fill
      priority
      sizes="(min-width: 1024px) 58vw, 100vw"
      className={`object-cover ${className}`}
    />
  );
}

function EditorialAnnotation({
  number,
  label,
  className,
  lineClassName,
  delayClassName,
}: {
  number: number;
  label: string;
  className: string;
  lineClassName: string;
  delayClassName: string;
}) {
  return (
    <div
      className={`motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 absolute motion-safe:duration-700 ${delayClassName} ${className}`}
    >
      <span className="grid size-7 place-items-center rounded-full border border-violet-700 bg-[#f8f7f4]/95 text-[11px] font-bold text-violet-900 shadow-sm">
        {number}
      </span>
      <span
        aria-hidden="true"
        className={`motion-safe:animate-in motion-safe:zoom-in-x absolute h-px origin-left bg-violet-700/70 motion-safe:duration-700 ${lineClassName}`}
      />
      <span className="absolute w-max max-w-40 bg-[#f8f7f4]/90 px-2 py-1 text-[11px] leading-4 font-medium text-neutral-800 shadow-sm backdrop-blur-sm">
        {label}
      </span>
    </div>
  );
}

function HeroVisual() {
  const startTimerRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const userControlledRef = useRef(false);
  const currentPositionRef = useRef(100);
  const revealRef = useRef<HTMLDivElement>(null);
  const scanLineRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLParagraphElement>(null);

  const applyScanPosition = useCallback((rawPosition: number) => {
    const position = Math.min(100, Math.max(0, rawPosition));
    currentPositionRef.current = position;
    if (revealRef.current) {
      revealRef.current.style.clipPath = `inset(0 0 0 ${position}%)`;
    }
    if (scanLineRef.current) {
      scanLineRef.current.style.left = `calc(${position}% - 1px)`;
    }
    if (sliderRef.current) {
      sliderRef.current.value = String(Math.round(position));
      sliderRef.current.setAttribute(
        'aria-valuetext',
        `已扫描 ${Math.round(100 - position)}%`
      );
    }
    if (resultRef.current) {
      const isVisible = position < 98;
      resultRef.current.style.opacity = isVisible ? '1' : '0';
      resultRef.current.style.visibility = isVisible ? 'visible' : 'hidden';
      resultRef.current.setAttribute('aria-hidden', String(!isVisible));
    }
  }, []);

  function stopAutomaticScan() {
    userControlledRef.current = true;
    if (startTimerRef.current !== null) {
      window.clearTimeout(startTimerRef.current);
      startTimerRef.current = null;
    }
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }

  useEffect(() => {
    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      startTimerRef.current = window.setTimeout(
        () => applyScanPosition(0),
        0
      );
      return () => {
        if (startTimerRef.current !== null) {
          window.clearTimeout(startTimerRef.current);
        }
      };
    }

    startTimerRef.current = window.setTimeout(() => {
      const duration = 1_900;
      const startedAt = window.performance.now();
      const animate = (now: number) => {
        if (userControlledRef.current) return;
        const progress = Math.min((now - startedAt) / duration, 1);
        applyScanPosition(100 * (1 - progress));

        if (progress < 1) {
          animationFrameRef.current = window.requestAnimationFrame(animate);
        } else {
          animationFrameRef.current = null;
        }
      };
      animationFrameRef.current = window.requestAnimationFrame(animate);
    }, 600);

    return () => {
      if (startTimerRef.current !== null) {
        window.clearTimeout(startTimerRef.current);
      }
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [applyScanPosition]);

  return (
    <figure id="example" className="relative w-full">
      <div
        data-testid="hero-scan-surface"
        onMouseEnter={stopAutomaticScan}
        onPointerDown={stopAutomaticScan}
        onTouchStart={stopAutomaticScan}
        onClick={stopAutomaticScan}
        className="group relative aspect-[5/6] overflow-hidden rounded-2xl bg-neutral-200 shadow-[0_30px_80px_rgba(35,28,55,0.14)] contain-paint focus-within:ring-2 focus-within:ring-violet-300 focus-within:ring-offset-4 focus-within:outline-none"
      >
        <ReviewImage alt="示例人物图，带有两处发布前复核批注" />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-neutral-950/45 via-transparent to-neutral-950/20" />

        <div className="pointer-events-none absolute top-5 right-5 left-5 z-30 text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.55)] sm:top-7 sm:right-7 sm:left-7">
          <p className="text-base font-medium sm:text-lg">
            第一眼，你看得出哪里不对吗？
          </p>
          <p className="mt-1.5 text-xs font-medium text-white/75 sm:text-sm">
            拖动扫描线查看 →
          </p>
          <p
            ref={resultRef}
            aria-hidden="true"
            className="invisible mt-2 text-lg font-bold opacity-0 transition-opacity duration-200 sm:text-xl"
          >
            找到 2 处建议人工复核的细节。
          </p>
        </div>

        <div
          data-testid="hero-scan-reveal"
          ref={revealRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 bg-violet-500/6 will-change-[clip-path]"
          style={{ clipPath: 'inset(0 0 0 100%)' }}
        >
          <div
            data-testid="hero-location-box"
            className="absolute top-[48%] left-[63%] h-[19%] w-[22%] border border-violet-200 bg-violet-500/10 shadow-[0_0_0_5px_rgba(109,76,167,0.12)]"
          />
          <div
            data-testid="hero-location-box"
            className="absolute top-[20%] left-[32%] h-[12%] w-[34%] border border-violet-200 bg-violet-500/10 shadow-[0_0_0_5px_rgba(109,76,167,0.12)]"
          />
          <EditorialAnnotation
            number={1}
            label="手指与掌部衔接值得复核"
            className="top-[51%] left-[66%]"
            lineClassName="top-3.5 right-5 w-20 -rotate-12"
            delayClassName="delay-300"
          />
          <EditorialAnnotation
            number={2}
            label="双眼朝向需要对照"
            className="top-[24%] left-[38%]"
            lineClassName="top-3.5 left-5 w-16 rotate-12"
            delayClassName="delay-500"
          />
        </div>

        <div
          aria-hidden="true"
          ref={scanLineRef}
          className="pointer-events-none absolute inset-y-0 z-20 w-px bg-white shadow-[0_0_18px_4px_rgba(255,255,255,0.75)]"
          style={{ left: 'calc(100% - 1px)' }}
        >
          <span className="absolute top-1/2 left-1/2 h-12 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80 bg-violet-700 shadow-[0_6px_20px_rgba(35,28,55,0.35)]" />
        </div>

        <input
          aria-label="拖动扫描示例图"
          aria-valuetext="已扫描 0%"
          ref={sliderRef}
          type="range"
          min="0"
          max="100"
          defaultValue="100"
          onPointerDown={stopAutomaticScan}
          onTouchStart={stopAutomaticScan}
          onClick={stopAutomaticScan}
          onKeyDown={stopAutomaticScan}
          onChange={(event) => {
            stopAutomaticScan();
            applyScanPosition(Number(event.target.value));
          }}
          className="absolute inset-0 z-40 h-full w-full cursor-ew-resize opacity-0"
        />
      </div>
    </figure>
  );
}

function StoryVisual({ activeStep }: { activeStep: StoryStep }) {
  const stageImageClass =
    activeStep === 'find'
      ? 'object-cover'
      : activeStep === 'understand'
        ? 'scale-[2.25] object-[72%_61%]'
        : 'scale-[3.1] object-[73%_63%]';

  return (
    <div
      data-testid="story-stage-image"
      data-active-step={activeStep}
      className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-neutral-200 shadow-[0_28px_70px_rgba(35,28,55,0.12)]"
    >
      <ReviewImage
        alt="Find、Understand、Fix 连续审查示例"
        className={`transition-transform duration-500 motion-reduce:transition-none ${stageImageClass}`}
      />
      <div className="absolute inset-0 bg-linear-to-t from-neutral-950/45 via-transparent to-transparent" />
      <div
        className={`absolute rounded-xl border border-violet-300/90 bg-violet-500/8 shadow-[0_0_0_8px_rgba(109,76,167,0.08)] transition-all duration-500 motion-reduce:transition-none ${activeStep === 'find' ? 'top-[49%] left-[64%] size-24 sm:size-28' : 'top-[53%] left-[57%] h-[21%] w-[27%]'}`}
      />
      <span className="absolute top-[48%] left-[62%] grid size-7 place-items-center rounded-full bg-violet-700 text-xs font-bold text-white">
        {activeStep === 'find' ? '1' : activeStep === 'understand' ? '2' : '3'}
      </span>
      <div className="absolute right-4 bottom-4 left-4 rounded-xl bg-[#f8f7f4]/95 p-4 text-neutral-900 shadow-lg backdrop-blur-sm sm:right-6 sm:bottom-6 sm:left-auto sm:w-[310px]">
        {activeStep === 'find' ? (
          <>
            <p className="text-xs font-semibold text-violet-700">FIND</p>
            <p className="mt-2 text-sm font-semibold">手部结构需要检查</p>
            <p className="mt-1 text-xs leading-5 text-neutral-600">
              已定位到值得放大确认的局部。
            </p>
          </>
        ) : activeStep === 'understand' ? (
          <>
            <p className="text-xs font-semibold text-violet-700">UNDERSTAND</p>
            <p className="mt-2 text-sm font-semibold">为什么值得检查</p>
            <p className="mt-1 text-xs leading-5 text-neutral-600">
              食指与掌部的连接关系可能不够自然。
            </p>
          </>
        ) : (
          <>
            <p className="text-xs font-semibold text-violet-700">FIX</p>
            <p className="mt-2 text-sm font-semibold">建议怎么调整</p>
            <p className="mt-1 text-xs leading-5 text-neutral-600">
              检查食指根部与掌部衔接，保持当前手势和画面风格。
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function StoryStepNumber({
  step,
  index,
  active,
}: {
  step: StoryStep;
  index: number;
  active: boolean;
}) {
  return (
    <div
      data-testid="story-step-number"
      className={`relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-xl border transition-[border-color,background-color,color,box-shadow,transform] duration-300 motion-reduce:transition-none ${active ? 'scale-[1.02] border-violet-700 bg-violet-700 text-white shadow-[0_12px_30px_rgba(109,76,167,0.18)]' : 'border-neutral-300 bg-neutral-100 text-neutral-400'}`}
      data-story-step-number={step}
    >
      <span
        aria-hidden="true"
        className="text-4xl font-semibold tracking-[-0.04em] tabular-nums"
      >
        {index + 1}
      </span>
      <span data-testid={`story-step-number-${step}`} className="sr-only">
        {index + 1}
      </span>
    </div>
  );
}

function WorkspacePreview() {
  const response = getMockAnalysisResponse();
  const currentIssue = response.issues[0];

  return (
    <div className="grid overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_28px_80px_rgba(35,28,55,0.1)] lg:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
      <div className="border-b border-neutral-200 p-3 sm:p-5 lg:border-r lg:border-b-0">
        <div className="mb-3 flex items-center justify-between text-xs text-neutral-500">
          <span className="font-medium text-neutral-800">图片定位</span>
          <span>示例检查报告</span>
        </div>
        <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
          <ReviewImage alt="完整检查工作台中的示例人物图" />
          <div className="absolute top-[47%] left-[61%] h-[22%] w-[17%] border border-violet-600 bg-violet-500/8">
            <span className="absolute -top-3 -left-3 grid size-6 place-items-center rounded-full bg-violet-700 text-[11px] font-bold text-white">
              1
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <div className="border-b border-neutral-200 p-5 sm:p-6">
          <p className="text-sm font-semibold text-neutral-950">整体摘要</p>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            发现 {response.summary.issue_count} 个建议人工复核的局部。
          </p>
        </div>
        <div className="border-b border-neutral-200 px-5 py-4 sm:px-6">
          <p className="text-xs font-semibold text-violet-700">当前问题</p>
          <h3 className="mt-2 text-xl font-semibold text-neutral-950">
            {currentIssue.title}
          </h3>
          <p className="mt-2 text-xs font-medium text-neutral-500">
            高修改优先级
          </p>
        </div>
        <div className="grid flex-1 gap-5 p-5 text-sm sm:p-6">
          <div>
            <p className="font-semibold text-neutral-950">检查原因</p>
            <p className="mt-2 leading-6 text-neutral-600">
              {currentIssue.reason}
            </p>
          </div>
          <div>
            <p className="font-semibold text-neutral-950">修改建议</p>
            <p className="mt-2 leading-6 text-neutral-600">
              {currentIssue.suggestion}
            </p>
          </div>
          <div className="mt-auto grid grid-cols-2 gap-3">
            <span className="grid min-h-11 place-items-center rounded-lg bg-violet-700 px-3 text-sm font-semibold text-white">
              下一项
            </span>
            <span className="grid min-h-11 place-items-center rounded-lg border border-neutral-300 px-3 text-sm font-semibold text-neutral-700">
              忽略此项
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingPage({ onUpload }: LandingPageProps) {
  const [activeStep, setActiveStep] = useState<StoryStep>('find');
  const stepRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const step = visibleEntry?.target.getAttribute('data-story-step');
        if (step === 'find' || step === 'understand' || step === 'fix') {
          setActiveStep(step);
        }
      },
      { rootMargin: '-30% 0px -45% 0px', threshold: [0.25, 0.6] }
    );

    const elements = stepRefs.current;
    elements.forEach((element) => element && observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <main
      data-testid="landing-page"
      className="overflow-x-clip bg-[#f8f7f4] text-neutral-950 selection:bg-violet-200 selection:text-violet-950"
    >
      <section className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-[1440px] items-center gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:gap-14 lg:py-14">
        <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 max-w-xl motion-safe:duration-700">
          <p className="text-xs font-semibold tracking-[0.18em] text-violet-700">
            AI IMAGE REVIEW FOR CREATORS
          </p>
          <h1 className="mt-5 text-5xl leading-[1.06] font-semibold tracking-[-0.04em] text-balance sm:text-6xl lg:text-[4.5rem]">
            你看不出来的 AI 痕迹，先替你找出来。
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-neutral-600 sm:text-lg sm:leading-8">
            有些 AI
            图第一眼没有问题，细节却经不起放大。上传图片，找出值得复核的位置，看懂哪里不自然，以及下一步该怎么改。
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={onUpload}
              className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-violet-700 px-5 text-sm font-semibold whitespace-nowrap text-white transition hover:bg-violet-800 focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 focus-visible:outline-none active:translate-y-px"
            >
              <IconUpload size={18} stroke={1.8} />
              上传图片开始检查
            </button>
            <a
              href="#review-story"
              className="inline-flex min-h-12 items-center gap-2 px-2 text-sm font-semibold whitespace-nowrap text-neutral-800 underline decoration-neutral-300 underline-offset-6 transition hover:text-violet-700 hover:decoration-violet-500 focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:outline-none"
            >
              查看示例
              <IconArrowRight size={17} stroke={1.8} />
            </a>
            <p className="w-full text-xs leading-5 text-neutral-500">
              无需登录即可体验，一次检查一张图片
            </p>
          </div>
        </div>
        <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 mx-auto w-full max-w-[680px] motion-safe:duration-1000 lg:justify-self-end">
          <HeroVisual />
        </div>
      </section>

      <section className="mx-auto max-w-[1320px] px-5 py-24 sm:px-8 lg:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-20">
          <div>
            <h2 className="max-w-3xl text-4xl leading-tight font-semibold tracking-[-0.035em] text-balance sm:text-5xl">
              图已经很好了。问题往往只藏在最后那几个细节里。
            </h2>
            <div className="mt-10 space-y-6 text-lg leading-8 text-neutral-700">
              <p>“我自己看了半天都没发现。”</p>
              <p>“就坏了一只手，我不想整张重抽。”</p>
              <p>“我知道这里怪，但不知道到底该怎么改。”</p>
            </div>
          </div>
          <div className="grid grid-cols-[1fr_0.58fr] items-end gap-4 sm:gap-6">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-neutral-200">
              <ReviewImage alt="第一眼看起来完整的示例人物图" />
            </div>
            <div className="relative mb-8 aspect-square overflow-hidden rounded-2xl bg-neutral-200 shadow-[0_20px_55px_rgba(35,28,55,0.14)]">
              <ReviewImage
                alt="放大后的手部局部细节"
                className="scale-[2.8] object-[73%_62%]"
              />
              <span className="absolute right-3 bottom-3 rounded-full bg-violet-700 px-3 py-1.5 text-xs font-semibold text-white">
                放大复核
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-neutral-200 bg-[#f3f1ed]">
        <div className="mx-auto max-w-[1320px] px-5 py-24 sm:px-8 lg:py-32">
          <p className="text-sm font-semibold text-violet-700">
            Keep the image. Fix what gives it away.
          </p>
          <h2 className="mt-6 max-w-5xl text-5xl leading-[1.08] font-semibold tracking-[-0.04em] text-balance sm:text-6xl lg:text-7xl">
            保留你喜欢的画面，只修那些容易露馅的细节。
          </h2>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-neutral-600">
            一张图已经八九成满意，不应该因为一只手、一处边界或一个局部细节重新生成整张。先找到真正需要处理的位置，再决定怎么改。
          </p>
        </div>
      </section>

      <section
        id="how-it-works"
        className="mx-auto max-w-[1320px] px-5 py-24 sm:px-8 lg:py-32"
      >
        <div id="review-story" className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div
            data-testid="story-sticky-visual"
            className="lg:sticky lg:top-24 lg:self-start"
          >
            <StoryVisual activeStep={activeStep} />
          </div>
          <div className="divide-y divide-neutral-200">
            {storySteps.map((step, index) => (
              <div
                key={step.key}
                ref={(element) => {
                  stepRefs.current[index] = element;
                }}
                data-story-step={step.key}
                className="flex min-h-[52dvh] items-center py-14 first:pt-0 last:pb-0 lg:min-h-[70dvh]"
              >
                <button
                  type="button"
                  aria-pressed={activeStep === step.key}
                  onClick={() => setActiveStep(step.key)}
                  className="group w-full text-left focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-4 focus-visible:outline-none"
                >
                  <div className="grid gap-6 sm:grid-cols-[96px_minmax(0,1fr)] sm:items-start sm:gap-7">
                    <StoryStepNumber
                      step={step.key}
                      index={index}
                      active={activeStep === step.key}
                    />
                    <div>
                      <span
                        className={`text-xs font-semibold tracking-[0.16em] transition-colors ${activeStep === step.key ? 'text-violet-700' : 'text-neutral-400'}`}
                      >
                        {step.label}
                      </span>
                      <h2 className="mt-4 text-4xl leading-tight font-semibold tracking-[-0.035em] text-balance sm:text-5xl">
                        {step.title}
                      </h2>
                      <p className="mt-5 max-w-lg text-base leading-7 text-neutral-600 sm:text-lg sm:leading-8">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f3f1ed] px-5 py-24 sm:px-8 lg:py-32">
        <div className="mx-auto max-w-[1320px]">
          <div className="max-w-3xl">
            <h2 className="text-4xl leading-tight font-semibold tracking-[-0.035em] text-balance sm:text-5xl">
              看见完整的检查过程
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-600">
              从图片定位到原因解释和修改建议，真正需要复核的内容都集中在同一个工作台里。
            </p>
          </div>
          <div className="mt-12">
            <WorkspacePreview />
          </div>
        </div>
      </section>

      <section
        id="boundaries"
        className="mx-auto max-w-[1320px] px-5 pt-24 sm:px-8 lg:pt-32"
      >
        <div className="border-t border-neutral-300 pt-10">
          <IconEye size={28} stroke={1.6} className="text-violet-700" />
          <h2 className="mt-5 max-w-3xl text-3xl leading-tight font-semibold tracking-[-0.03em] sm:text-4xl">
            AI 负责提出候选问题，最终判断由你完成。
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-600">
            它不会裁定图片是不是
            AI，也不会替你自动修改。每一处建议都需要创作者亲自确认。
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1320px] px-5 py-24 sm:px-8 lg:py-36">
        <div className="relative overflow-hidden rounded-2xl bg-neutral-950 px-6 py-14 text-[#f8f7f4] sm:px-10 sm:py-18 lg:px-16 lg:py-20">
          <p className="text-xs font-semibold tracking-[0.18em] text-violet-300">
            ONE LAST REVIEW
          </p>
          <h2 className="mt-7 max-w-4xl text-4xl leading-tight font-semibold tracking-[-0.035em] text-balance sm:text-5xl lg:text-6xl">
            发出去之前，再让另一双眼睛看一遍。
          </h2>
          <p className="mt-6 max-w-xl text-base leading-7 text-neutral-300 sm:text-lg">
            找出你可能漏看的细节，再决定哪些值得改。
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={onUpload}
              className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-violet-500 px-5 text-sm font-semibold whitespace-nowrap text-white transition hover:bg-violet-400 focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 focus-visible:outline-none active:translate-y-px"
            >
              <IconUpload size={18} stroke={1.8} />
              上传图片开始检查
            </button>
            <span className="text-sm text-neutral-400">无需登录即可体验</span>
          </div>
        </div>
      </section>
    </main>
  );
}
