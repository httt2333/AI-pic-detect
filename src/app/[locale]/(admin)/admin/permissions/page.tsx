import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PERMISSIONS, requirePermission } from '@/core/rbac';
import { Header, Main, MainHeader } from '@/shared/blocks/dashboard';
import { TableCard } from '@/shared/blocks/table';
import { getPermissions } from '@/shared/services/rbac';
import { Crumb } from '@/shared/types/blocks/common';
import { type Table } from '@/shared/types/blocks/table';

export default async function AdminPermissionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Check if user has permission to read permissions
  await requirePermission({
    code: PERMISSIONS.PERMISSIONS_READ,
    redirectUrl: `/admin/no-permission`,
    locale,
  });

  const permissions = await getPermissions();

  const t = await getTranslations('admin.permissions');

  const crumbs: Crumb[] = [
    { title: t('list.crumbs.admin'), url: '/admin' },
    { title: t('list.crumbs.permissions'), is_active: true },
  ];

  const table: Table = {
    columns: [
      { name: 'code', title: t('fields.code') },
      { name: 'title', title: t('fields.title') },
      { name: 'resource', title: t('fields.resource') },
      { name: 'action', title: t('fields.action') },
      { name: 'createdAt', title: t('fields.created_at'), type: 'time' },
    ],
    data: permissions,
  };

  return (
    <>
      <Header crumbs={crumbs} />
      <Main>
        <MainHeader title={t('list.title')} />
        <TableCard table={table} />
      </Main>
    </>
  );
}
