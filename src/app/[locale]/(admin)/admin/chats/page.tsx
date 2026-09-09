import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PERMISSIONS, requirePermission } from '@/core/rbac';
import { Header, Main, MainHeader } from '@/shared/blocks/dashboard';
import { TableCard } from '@/shared/blocks/table';
import { getChats, getChatsCount } from '@/shared/models/chat';
import { Button, Crumb, Tab } from '@/shared/types/blocks/common';
import { type Table } from '@/shared/types/blocks/table';

export default async function ChatsPage({
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
    code: PERMISSIONS.AITASKS_READ,
    redirectUrl: '/admin/no-permission',
    locale,
  });

  const t = await getTranslations('admin.chats');

  const { page: pageNum, pageSize } = await searchParams;
  const page = pageNum || 1;
  const limit = pageSize || 30;

  const crumbs: Crumb[] = [
    { title: t('list.crumbs.admin'), url: '/admin' },
    { title: t('list.crumbs.chats'), is_active: true },
  ];

  const total = await getChatsCount({});

  const chats = await getChats({
    page,
    limit,
    getUser: true,
  });

  const table: Table = {
    columns: [
      { name: 'title', title: t('fields.title'), type: 'copy' },
      { name: 'user', title: t('fields.user'), type: 'user' },
      { name: 'createdAt', title: t('fields.created_at'), type: 'time' },
      { name: 'status', title: t('fields.status'), type: 'label' },
      { name: 'model', title: t('fields.model'), type: 'label' },
      { name: 'provider', title: t('fields.provider'), type: 'label' },
      {
        name: 'action',
        title: t('fields.action'),
        type: 'dropdown',
        callback: (item) => {
          return [
            {
              title: t('list.buttons.view'),
              url: `/chat/${item.id}`,
              target: '_blank',
              icon: 'RiEyeLine',
            },
          ];
        },
      },
    ],
    data: chats,
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
