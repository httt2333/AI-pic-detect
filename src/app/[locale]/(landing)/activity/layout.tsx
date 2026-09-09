import { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';

import { ConsoleLayout } from '@/shared/blocks/console/layout';

export default async function ActivityLayout({
  children,
}: {
  children: ReactNode;
}) {
  const t = await getTranslations('activity.sidebar');

  // settings title
  const title = t('title');

  // settings nav
  const nav = t.raw('nav');

  const topNav = t.raw('top_nav');

  return (
    <ConsoleLayout
      title={title}
      nav={nav}
      topNav={topNav}
      className="py-16 md:py-20"
    >
      {children}
    </ConsoleLayout>
  );
}
