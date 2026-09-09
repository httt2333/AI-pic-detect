import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PERMISSIONS, requirePermission } from '@/core/rbac';
import { Header, Main, MainHeader } from '@/shared/blocks/dashboard';
import { TableCard } from '@/shared/blocks/table';
import { getApikeys, getApikeysCount } from '@/shared/models/apikey';
import { Button, Crumb } from '@/shared/types/blocks/common';
import { type Table } from '@/shared/types/blocks/table';

export default async function ApiKeysPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: number; pageSize?: number }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Check if user has permission to read api keys
  await requirePermission({
    code: PERMISSIONS.APIKEYS_READ,
    redirectUrl: '/admin/no-permission',
    locale,
  });

  const t = await getTranslations('admin.apikeys');

  const { page: pageNum, pageSize } = await searchParams;
  const page = pageNum || 1;
  const limit = pageSize || 30;

  const crumbs: Crumb[] = [
    { title: t('list.crumbs.admin'), url: '/admin' },
    { title: t('list.crumbs.apikeys'), is_active: true },
  ];

  const total = await getApikeysCount({});

  const apiKeys = await getApikeys({
    getUser: true,
    page,
    limit,
  });

  const table: Table = {
    columns: [
      { name: 'title', title: t('fields.title') },
      { name: 'key', title: t('fields.key'), type: 'copy' },
      { name: 'user', title: t('fields.user'), type: 'user' },
      { name: 'status', title: t('fields.status'), type: 'label' },
      { name: 'createdAt', title: t('fields.created_at'), type: 'time' },
    ],
    data: apiKeys,
    pagination: {
      total,
      page,
      limit,
    },
  };

  const actions: Button[] = [];

  return (
    <>
      <Header crumbs={crumbs} />
      <Main>
        <MainHeader title={t('list.title')} actions={actions} />
        <TableCard table={table} />
      </Main>
    </>
  );
}
