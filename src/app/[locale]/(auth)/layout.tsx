import { ProductHeader } from '@/features/ai-pic-detect/product-header';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[#f8f6ff] text-violet-950">
      <ProductHeader />
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
