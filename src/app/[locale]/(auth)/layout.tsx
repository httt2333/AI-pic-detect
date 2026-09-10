import { ArrowLeft } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { LocaleSelector, ThemeToggler } from '@/shared/blocks/common';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[#f8f6ff] text-violet-950">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-violet-100 bg-[#fdfcff]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 sm:px-8">
          <Link
            href="/"
            className="text-sm font-bold tracking-[-0.04em] text-violet-950"
          >
            AI-PIC-DETECT
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/"
              aria-label="返回图片检查"
              className="inline-flex min-h-10 items-center gap-2 px-2 text-sm font-semibold text-violet-800 transition hover:text-violet-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-700"
            >
              <ArrowLeft aria-hidden="true" size={17} strokeWidth={1.8} />
              <span className="hidden sm:inline">返回图片检查</span>
              <span className="sm:hidden">返回</span>
            </Link>
            <ThemeToggler />
            <LocaleSelector type="button" />
          </div>
        </div>
      </header>
      <main className="mx-auto grid min-h-dvh w-full max-w-[1400px] place-items-center px-5 pt-24 pb-10 sm:px-8">
        <div className="grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.72fr)] lg:gap-20">
          <section className="hidden lg:block">
            <p className="max-w-xl text-5xl leading-[1.08] font-semibold tracking-[-0.04em] text-violet-950">
              登录后，把每次检查变成可继续的创作记录。
            </p>
            <p className="mt-6 max-w-lg text-base leading-8 text-violet-950/65">
              查看历史检查、管理剩余额度，也可以随时回到首页继续免费体验。
            </p>
          </section>
          <div className="w-full">{children}</div>
        </div>
      </main>
    </div>
  );
}
