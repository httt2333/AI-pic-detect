import Link from 'next/link';

export function ProductHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-violet-100 bg-[#fdfcff]/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 sm:px-8">
        <Link
          href="/zh"
          className="text-sm font-bold tracking-[-0.04em] text-violet-950"
        >
          AI-PIC-DETECT
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium text-violet-800">
          <Link href="/zh#how-it-works" className="hidden hover:text-violet-950 sm:block">
            怎么检查
          </Link>
          <Link href="/zh#why-this" className="hidden hover:text-violet-950 lg:block">
            为什么这样做
          </Link>
          <Link href="/zh#boundaries" className="hidden hover:text-violet-950 sm:block">
            产品边界
          </Link>
          <Link href="/zh/pricing" className="hidden hover:text-violet-950 lg:block">
            额度与价格
          </Link>
          <Link href="/reviews" className="hidden hover:text-violet-950 xl:block">
            检查记录
          </Link>
          <Link
            href="/zh/sign-in?callbackUrl=/reviews"
            className="hidden hover:text-violet-950 sm:block"
          >
            登录
          </Link>
          <Link
            href="/zh"
            className="bg-violet-800 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-violet-950"
          >
            开始检查
          </Link>
        </nav>
      </div>
    </header>
  );
}
