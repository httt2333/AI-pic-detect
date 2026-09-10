'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { IconArrowRight, IconEye, IconUpload } from '@tabler/icons-react';


type LandingPageProps = {
  onUpload: () => void;
};

const storySteps = [
  {
    key: 'find',
    label: 'FIND',
    title: '先看哪里值得改。',
    description: '定位观众最容易注意到的局部。',
  },
  {
    key: 'understand',
    label: 'UNDERSTAND',
    title: '再看为什么不自然。',
    description: '把结构、边界、遮挡、光影这些问题说清楚，再决定怎么改。',
  },
  {
    key: 'fix',
    label: 'FIX',
    title: '最后只改必要的地方。',
    description: '只针对问题区域给出修改方向，其他地方尽量不动。',
  },
] as const;

type StoryStep = (typeof storySteps)[number]['key'];

const realReactionRows = [
  [
    { text: '用了ai也不检查一下手指，说好的匠人精神呢', tag: '手指' },
    { text: '放大看腿部线条有笔触', tag: '线条' },
    { text: '瞳孔反射光影不连贯，眼神空洞像假人。', tag: '眼睛' },
    { text: '这个到底是不是ai啊头发真的巨怪', tag: '头发' },
    { text: '看远景就能看出来了，小细节是扭曲的', tag: '结构' },
    { text: '头饰部分，和后面的建筑物糊在一起了', tag: '边界' },
  ],
  [
    { text: '最好的方法还是看物体重叠部分', tag: '遮挡' },
    { text: '头发和皮肤、眉毛糊在一起，交界处黏黏糊糊', tag: '边界' },
    { text: '这应该不是吧？从那个帽子的阴影能看出来', tag: '光影' },
    { text: '衣服褶皱没有一点逻辑', tag: '褶皱' },
    { text: '感觉头颈肩的透视有问题', tag: '透视' },
    { text: '左边头发，右边耳环跟耳朵糊一起了', tag: '饰品' },
  ],
  [
    { text: '比如高光太多太亮，边缘太模糊等等', tag: '光影' },
    { text: '眼睛和头发都不是一个画风的', tag: '眼睛' },
    { text: '那个一圈白边都糊了', tag: '边界' },
    { text: '这个肩膀结构不对', tag: '结构' },
    { text: '发丝糊了，衣服褶皱处理也是该糊糊该错错', tag: '褶皱' },
    { text: '看一下角色的眼睛，太宽了', tag: '眼睛' },
    { text: 'ai跟实拍光影上面好容易看出来', tag: '光影' },
    { text: '清宵的线稿都是糊的', tag: '线稿' },
  ],
] as const;

function RealReactions() {
  return (
    <section
      data-testid="real-reactions"
      data-reaction-count="20"
      className="border-y border-neutral-200 bg-[#f3f1ed] py-24 sm:py-28 lg:py-32"
    >
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold tracking-[0.18em] text-violet-700">
            REAL REACTIONS
          </p>
          <h2 className="mt-5 max-w-2xl text-4xl leading-[1.08] font-semibold tracking-[-0.04em] text-balance sm:text-5xl">
            这些，都是观众真的会看的地方。
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-7 text-neutral-600 sm:text-lg sm:leading-8">
            手、眼睛、边界、透视、光影……很多 AI 感，最后都落在这些细节上。
          </p>
        </div>
      </div>
      <div
        className="mt-16 space-y-4 overflow-hidden sm:mt-20"
        aria-label="真实评论流"
      >
        {realReactionRows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            data-testid={`reaction-row-${rowIndex + 1}`}
            className={`reaction-marquee flex w-max gap-4 px-5 sm:gap-6 sm:px-8 ${rowIndex === 1 ? 'reaction-marquee-reverse' : ''}`}
          >
            {[...row, ...row].map((reaction, index) => (
              <blockquote
                key={`${rowIndex}-${index}`}
                className="reaction-quote flex max-w-[19rem] shrink-0 items-baseline gap-3 border-b border-neutral-300 pb-3 text-base leading-7 text-neutral-800 sm:max-w-[24rem] sm:text-lg"
              >
                <span className="text-xs font-semibold tracking-[0.14em] text-neutral-400">
                  {String(rowIndex + 1).padStart(2, '0')}
                </span>
                <span>{reaction.text}</span>
                <span className="shrink-0 text-xs font-medium text-violet-700/80">
                  {reaction.tag}
                </span>
              </blockquote>
            ))}
          </div>
        ))}
      </div>
      <div className="mx-auto mt-12 flex max-w-[1320px] flex-col gap-8 px-5 sm:px-8 lg:mt-16">
        <p className="text-xs text-neutral-500">
          节选自公开社区真实讨论，已匿名与节选。
          <span className="ml-2 text-neutral-400">
            Selected from real public discussions · anonymized &amp; shortened
          </span>
        </p>
      </div>
      <style>{`
        .reaction-marquee {
          animation: reaction-scroll 48s linear infinite;
        }
        .reaction-marquee-reverse {
          animation-name: reaction-scroll-reverse;
          animation-duration: 56s;
        }
        .reaction-marquee:hover,
        .reaction-marquee:focus-within {
          animation-play-state: paused;
        }
        @keyframes reaction-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes reaction-scroll-reverse {
          from { transform: translateX(-50%); }
          to { transform: translateX(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .reaction-marquee,
          .reaction-marquee-reverse {
            animation: none;
            transform: translateX(0);
            flex-wrap: wrap;
            width: auto;
          }
          .reaction-marquee > :nth-child(n + 7) {
            display: none;
          }
        }
      `}</style>
    </section>
  );
}

function WhyThisApproach() {
  return (
    <section
      id="why-this"
      data-testid="why-this"
      className="mx-auto max-w-[1320px] px-5 py-20 sm:px-8 lg:py-24"
    >
      <div className="max-w-3xl">
        <p className="text-xs font-semibold tracking-[0.18em] text-violet-700">
          WHY THIS APPROACH
        </p>
        <h2 className="mt-5 text-4xl leading-tight font-semibold tracking-[-0.035em] text-balance sm:text-5xl">
          比起直接给您一个结果，我们更在乎观众到底看到了什么。
        </h2>
        <p className="mt-6 max-w-2xl text-base leading-7 text-neutral-600 sm:text-lg sm:leading-8">
          生成模型一直在变，但观众指出的问题很具体。我们把这些真实反馈整理成检查方法，再交给多模态模型逐项看。
        </p>
      </div>
      <div className="mt-12 grid gap-8 border-t border-neutral-200 pt-8 sm:grid-cols-3 sm:gap-6">
        <p className="text-lg font-medium text-neutral-900">
          66,457 条公开评论
        </p>
        <p className="text-lg font-medium text-neutral-900">
          1,149 条高价值反馈
        </p>
        <p className="text-lg font-medium text-neutral-900">
          50 次样本测试 · 28 轮调试
        </p>
      </div>
      <p className="mt-8 max-w-2xl text-sm leading-6 text-neutral-500">
        不是追着模型版本跑，而是持续整理观众真正会在意的问题。
      </p>
    </section>
  );
}

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
      startTimerRef.current = window.setTimeout(() => applyScanPosition(0), 0);
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
        className="group relative aspect-[4/5] overflow-hidden rounded-lg bg-neutral-200 shadow-[0_18px_45px_rgba(35,28,55,0.1)] contain-paint focus-within:ring-2 focus-within:ring-violet-300 focus-within:ring-offset-4 focus-within:outline-none sm:aspect-[5/6]"
      >
        <ReviewImage alt="示例人物图，带有两处发布前复核批注" />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-neutral-950/45 via-transparent to-neutral-950/20" />

        <div className="pointer-events-none absolute top-5 right-5 left-5 z-30 text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.55)] sm:top-7 sm:right-7 sm:left-7">
          <p className="text-base font-medium sm:text-lg">
            第一眼，您看得出来吗？
          </p>
          <p className="mt-1.5 text-xs font-medium text-white/75 sm:text-sm">
            拖动查看 →
          </p>
          <p
            ref={resultRef}
            aria-hidden="true"
            className="invisible mt-2 text-lg font-bold opacity-0 transition-opacity duration-200 sm:text-xl"
          >
            发现 2 处需要注意的细节
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
            className="absolute top-[48%] left-[63%] h-[19%] w-[22%] border border-white/75 bg-transparent"
          />
          <div
            data-testid="hero-location-box"
            className="absolute top-[20%] left-[32%] h-[12%] w-[34%] border border-white/75 bg-transparent"
          />
          <EditorialAnnotation
            number={1}
            label="01　手部结构异常"
            className="top-[51%] left-[66%]"
            lineClassName="top-3.5 right-5 w-20 -rotate-12"
            delayClassName="delay-300"
          />
          <EditorialAnnotation
            number={2}
            label="02　双眼高光方向不一致"
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
      className="relative aspect-[4/5] overflow-hidden rounded-lg bg-neutral-200 shadow-[0_18px_45px_rgba(35,28,55,0.1)]"
    >
      <ReviewImage
        alt="Find、Understand、Fix 连续审查示例"
        className={`transition-transform duration-500 motion-reduce:transition-none ${stageImageClass}`}
      />
      <div className="absolute inset-0 bg-linear-to-t from-neutral-950/45 via-transparent to-transparent" />
      <div
        className={`absolute border border-white/80 bg-transparent transition-all duration-500 motion-reduce:transition-none ${activeStep === 'find' ? 'top-[49%] left-[64%] size-24 sm:size-28' : 'top-[53%] left-[57%] h-[21%] w-[27%]'}`}
      />
      <span className="absolute top-[48%] left-[62%] grid size-7 place-items-center rounded-full border border-white bg-neutral-950/75 text-xs font-bold text-white">
        {activeStep === 'find' ? '1' : activeStep === 'understand' ? '2' : '3'}
      </span>
      <div className="absolute right-4 bottom-4 left-4 rounded-xl bg-[#f8f7f4]/95 p-4 text-neutral-900 shadow-lg backdrop-blur-sm sm:right-6 sm:bottom-6 sm:left-auto sm:w-[310px]">
        {activeStep === 'find' ? (
          <>
            <p className="text-xs font-semibold text-violet-700">示例</p>
            <p className="mt-2 text-sm font-semibold">手部结构异常</p>
            <p className="mt-1 text-xs leading-5 text-neutral-600">
              手腕与手掌连接不自然。
            </p>
          </>
        ) : activeStep === 'understand' ? (
          <>
            <p className="text-xs font-semibold text-violet-700">示例</p>
            <p className="mt-2 text-sm font-semibold">结构连接异常</p>
            <p className="mt-1 text-xs leading-5 text-neutral-600">
              手腕与手掌之间缺少自然过渡。
            </p>
          </>
        ) : (
          <>
            <p className="text-xs font-semibold text-violet-700">示例</p>
            <p className="mt-2 text-sm font-semibold">修改建议</p>
            <p className="mt-1 text-xs leading-5 text-neutral-600">
              调整手腕与手掌的连接和轮廓，保留原来的手势与其他区域。
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
      className={`relative shrink-0 border-b transition-[border-color,color] duration-300 motion-reduce:transition-none ${active ? 'border-violet-700 text-violet-800' : 'border-neutral-300 text-neutral-400'}`}
      data-story-step-number={step}
    >
      <span
        aria-hidden="true"
        className="text-xs font-semibold tracking-[0.16em] tabular-nums"
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
  return (
    <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 grid overflow-hidden border border-neutral-200 bg-white shadow-[0_18px_50px_rgba(35,28,55,0.08)] motion-safe:duration-700 lg:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
      <div className="border-b border-neutral-200 p-3 sm:p-5 lg:border-r lg:border-b-0">
        <div className="mb-3 flex items-center justify-between text-xs text-neutral-500">
          <span className="font-medium text-neutral-800">检查结果</span>
          <span>发现 3 处需要注意的局部</span>
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
          <p className="text-sm font-semibold text-neutral-950">
            问题在哪，为什么，怎么改。
          </p>
          <p className="mt-2 text-sm leading-6 text-neutral-600">一目了然。</p>
        </div>
        <div className="border-b border-neutral-200 px-5 py-4 sm:px-6">
          <p className="text-xs font-semibold text-violet-700">当前问题</p>
          <h3 className="mt-2 text-xl font-semibold text-neutral-950">
            手部结构异常
          </h3>
          <p className="mt-2 text-xs font-medium text-neutral-500">
            建议先处理
          </p>
        </div>
        <div className="grid flex-1 gap-5 p-5 text-sm sm:p-6">
          <div>
            <p className="font-semibold text-neutral-950">为什么</p>
            <p className="mt-2 leading-6 text-neutral-600">
              手腕与手掌连接缺少自然过渡。
            </p>
          </div>
          <div>
            <p className="font-semibold text-neutral-950">怎么改</p>
            <p className="mt-2 leading-6 text-neutral-600">
              调整连接和轮廓，其他地方不动。
            </p>
          </div>
          <div className="mt-auto grid grid-cols-2 gap-3">
            <span className="grid min-h-11 place-items-center rounded-lg bg-violet-700 px-3 text-sm font-semibold text-white">
              看下一处
            </span>
            <span className="grid min-h-11 place-items-center rounded-lg border border-neutral-300 px-3 text-sm font-semibold text-neutral-700">
              这处不用改
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
            AI IMAGE REVIEW FOR ANIME CREATORS
          </p>
          <h1 className="mt-5 text-5xl leading-[1.06] font-semibold tracking-[-0.04em] text-balance sm:text-6xl lg:text-[4.5rem]">
            让 AI 图更经得住细看。
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-neutral-600 sm:text-lg sm:leading-8">
            帮您找出二次元 AI
            图里容易被观众注意到的生成痕迹：哪里不自然，为什么，怎么改。
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
              查看示例 →
              <IconArrowRight size={17} stroke={1.8} />
            </a>
            <p className="w-full text-xs leading-5 text-neutral-500">
              无需登录 · 一次检查一张图片
            </p>
          </div>
        </div>
        <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 mx-auto w-full max-w-[680px] motion-safe:duration-1000 lg:justify-self-end">
          <HeroVisual />
        </div>
      </section>

      <RealReactions />

      <WhyThisApproach />

      <section className="border-y border-neutral-200 bg-[#f3f1ed]">
        <div
          data-testid="keep-image-section"
          className="mx-auto grid max-w-[1320px] gap-12 px-5 py-24 sm:px-8 lg:grid-cols-2 lg:items-center lg:gap-20 lg:py-32"
        >
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-violet-700">
              KEEP WHAT ALREADY WORKS
            </p>
            <h2 className="max-w-5xl text-5xl leading-[1.08] font-semibold tracking-[-0.04em] text-balance sm:text-6xl lg:text-7xl">
              我们和您一起精益求精
            </h2>
            <p className="mt-8 max-w-xl text-lg leading-8 text-neutral-600">
              只改有问题的局部，保留已经满意的部分。
            </p>
          </div>
          <div
            data-testid="keep-image-crops"
            data-crop-count="3"
            className="grid grid-cols-[1.15fr_0.72fr] items-end gap-4 sm:order-first sm:gap-6 lg:order-first"
          >
            <div className="motion-safe:animate-in motion-safe:fade-in relative aspect-[4/5] overflow-hidden bg-neutral-200 motion-safe:duration-700">
              <ReviewImage
                alt="保留完整画面的示例人物图"
                className="object-[50%_45%]"
              />
              <span className="absolute right-3 bottom-3 border border-white/70 bg-neutral-950/65 px-2 py-1 text-xs font-medium text-white">
                完整画面
              </span>
            </div>
            <div className="motion-safe:animate-in motion-safe:fade-in relative mb-10 aspect-[0.9/1] overflow-hidden bg-neutral-200 motion-safe:delay-150 motion-safe:duration-700">
              <ReviewImage
                alt="手部局部细节"
                className="scale-[2.8] object-[73%_62%]"
              />
              <span className="absolute right-3 bottom-3 border border-white/70 bg-neutral-950/65 px-2 py-1 text-xs font-medium text-white">
                手部
              </span>
            </div>
            <div className="motion-safe:animate-in motion-safe:fade-in relative col-span-2 -mt-2 ml-[18%] aspect-[1.7/1] max-w-[68%] overflow-hidden bg-neutral-200 motion-safe:delay-300 motion-safe:duration-700 sm:-mt-10">
              <ReviewImage
                alt="饰品与边界局部细节"
                className="scale-[3.7] object-[67%_57%]"
              />
              <span className="absolute right-3 bottom-3 border border-white/70 bg-neutral-950/65 px-2 py-1 text-xs font-medium text-white">
                饰品 / 边界
              </span>
            </div>
          </div>
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
                className="flex min-h-[52dvh] items-center py-14 first:pt-0 last:pb-0 lg:min-h-[65dvh]"
              >
                <button
                  type="button"
                  aria-pressed={activeStep === step.key}
                  onClick={() => setActiveStep(step.key)}
                  className="group w-full text-left focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-4 focus-visible:outline-none"
                >
                  <div className="grid gap-6 sm:grid-cols-[48px_minmax(0,1fr)] sm:items-start sm:gap-7">
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
              问题在哪，为什么，怎么改。
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-600">
              一目了然。
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
            我们是您的助手，负责提出有依据的判断。
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-600">
            我们是您的助手，负责提出有依据的判断。有把握才提醒，最后改不改由您决定。
          </p>
        </div>
      </section>

      <section
        data-testid="final-cta"
        className="bg-neutral-950 px-5 py-24 text-[#f8f7f4] sm:px-8 lg:py-36"
      >
        <div className="mx-auto max-w-[1320px] px-0 sm:px-2 lg:px-8">
          <p className="text-xs font-semibold tracking-[0.18em] text-violet-300">
            ONE LAST REVIEW
          </p>
          <h2 className="mt-7 max-w-4xl text-4xl leading-tight font-semibold tracking-[-0.035em] text-balance sm:text-5xl lg:text-6xl">
            每次发布前，我们先帮您把明显的问题找出来。
          </h2>
          <p className="mt-6 max-w-xl text-base leading-7 text-neutral-300 sm:text-lg">
            少一点返工，也少一点风险。
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
            <span className="text-sm text-neutral-400">
              无需登录 · 一次检查一张图片
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
