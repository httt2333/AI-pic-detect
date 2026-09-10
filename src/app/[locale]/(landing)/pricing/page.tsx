import Link from 'next/link';
import { shouldLoadAccountPricingState } from '@/features/pricing/pricing-access';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { getThemePage } from '@/core/theme';
import { getMetadata } from '@/shared/lib/seo';
import { getCurrentSubscription } from '@/shared/models/subscription';
import { getUserInfo } from '@/shared/models/user';
import type { DynamicPage } from '@/shared/types/blocks/landing';
import type { Pricing } from '@/shared/types/blocks/pricing';

export const revalidate = 3600;

export const generateMetadata = getMetadata({
  metadataKey: 'pages.pricing.metadata',
  canonicalUrl: '/pricing',
});

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('pages.pricing');
  const pricingSection = t.raw('page.sections.pricing') as Pricing;

  // Avoid auth/database work while checkout is intentionally unavailable.
  let currentSubscription;
  if (shouldLoadAccountPricingState(pricingSection.purchase_enabled)) {
    try {
      const user = await getUserInfo();
      if (user) {
        currentSubscription = await getCurrentSubscription(user.id);
      }
    } catch {
      currentSubscription = undefined;
    }
  }

  // build page sections
  const page: DynamicPage = {
    title: t.raw('page.title'),
    sections: {
      pricing: {
        ...pricingSection,
        data: {
          currentSubscription,
        },
      },
    },
  };

  // load page component
  const Page = await getThemePage('dynamic-page');

  return (
    <div className="min-h-screen bg-[#fdfcff] pt-16 text-violet-950">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-violet-100 bg-[#fdfcff]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 sm:px-8">
          <Link href="/" className="text-sm font-bold tracking-[-0.04em]">
            AI-PIC-DETECT
          </Link>
          <nav className="flex items-center gap-5 text-sm font-medium text-violet-800">
            <Link
              href="/#how-it-works"
              className="hidden transition hover:text-violet-950 sm:block"
            >
              使用流程
            </Link>
            <Link
              href="/#boundaries"
              className="hidden transition hover:text-violet-950 sm:block"
            >
              产品边界
            </Link>
            <Link
              href="/zh/pricing"
              aria-current="page"
              className="hidden font-semibold text-violet-950 lg:block"
            >
              购买额度
            </Link>
            <Link
              href="/reviews"
              className="hidden transition hover:text-violet-950 xl:block"
            >
              检查记录
            </Link>
            <Link
              href="/zh/sign-in?callbackUrl=/reviews"
              className="hidden transition hover:text-violet-950 sm:block"
            >
              登录
            </Link>
            <Link
              href="/"
              className="bg-violet-800 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-violet-950"
            >
              开始检查
            </Link>
          </nav>
        </div>
      </header>
      <Page locale={locale} page={page} />
    </div>
  );
}
