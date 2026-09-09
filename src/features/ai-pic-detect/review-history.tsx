import Link from 'next/link';

export function ReviewHistory({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  if (!isAuthenticated) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
        <section className="rounded-2xl border border-violet-200 bg-white p-8 shadow-xl shadow-violet-950/5 sm:p-12">
          <p className="text-sm font-semibold tracking-wide text-violet-700">
            AI-PIC-DETECT
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-violet-950 sm:text-4xl">
            登录后查看检查记录
          </h1>
          <p className="mt-4 max-w-xl leading-7 text-violet-950/70">
            游客可直接完成一次检查。登录后，已保存的检查结果、复检和额度使用记录会集中在账户中。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/sign-in?callbackUrl=/reviews"
              className="bg-violet-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-950"
            >
              登录或注册
            </Link>
            <Link
              href="/"
              className="border border-violet-300 px-5 py-3 text-sm font-semibold text-violet-900 transition hover:bg-violet-50"
            >
              继续游客检查
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
      <section className="rounded-2xl border border-violet-200 bg-white p-8 shadow-xl shadow-violet-950/5 sm:p-12">
        <p className="text-sm font-semibold tracking-wide text-violet-700">
          AI-PIC-DETECT
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-violet-950 sm:text-4xl">
          检查记录
        </h1>
        <p className="mt-4 leading-7 text-violet-950/70">
          暂无已保存的检查记录。
        </p>
        <p className="mt-2 leading-7 text-violet-950/55">
          真实分析接口与记录存储完成后，新的检查会显示在这里。
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex bg-violet-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-950"
        >
          开始一次检查
        </Link>
      </section>
    </main>
  );
}
