import { ReactNode } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { requireAdminAccess } from '@/core/rbac/permission';
import { LocaleDetector } from '@/shared/blocks/common';
import { DashboardLayout } from '@/shared/blocks/dashboard/layout';
import { getAllConfigs } from '@/shared/models/config';
import { Sidebar as SidebarType } from '@/shared/types/blocks/dashboard';

/**
 * Admin layout to manage datas
 */
export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Check if user has admin access permission
  await requireAdminAccess({
    redirectUrl: `/no-permission`,
    locale: locale || '',
  });

  const t = await getTranslations('admin');

  const sidebar: SidebarType = t.raw('sidebar');

  const configs = await getAllConfigs();
  if (configs.app_name) {
    sidebar.header!.brand!.title = configs.app_name;
    sidebar.header!.brand!.logo!.alt = configs.app_name;
  }
  if (configs.app_description) {
    sidebar.header!.brand!.description = configs.app_description;
  }
  if (configs.app_logo) {
    sidebar.header!.brand!.logo!.src = configs.app_logo;
  }
  if (configs.version) {
    sidebar.header!.version = configs.version;
  }

  return (
    <DashboardLayout sidebar={sidebar}>
      <LocaleDetector />
      {children}
    </DashboardLayout>
  );
}
