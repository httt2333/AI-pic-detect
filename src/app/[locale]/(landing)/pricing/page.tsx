import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';

import { getThemePage } from '@/core/theme';
import { shouldLoadAccountPricingState } from '@/features/pricing/pricing-access';
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
    <div className="min-h-screen bg-[#fdfcff] text-violet-950">
      <header className="border-b border-violet-100 bg-white/90">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 sm:px-8">
          <Link href="/" className="text-sm font-bold tracking-[-0.04em]">
            AI-PIC-DETECT
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-violet-200 px-3.5 py-2 text-sm font-semibold text-violet-800 transition hover:border-violet-500 hover:bg-violet-50"
          >
            ← 返回图片检查
          </Link>
        </div>
      </header>
      <Page locale={locale} page={page} />
    </div>
  );
}
