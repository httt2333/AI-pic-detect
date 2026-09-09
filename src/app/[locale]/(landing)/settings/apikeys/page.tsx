import { getTranslations } from 'next-intl/server';

import { Empty } from '@/shared/blocks/common';
import { TableCard } from '@/shared/blocks/table';
import {
  Apikey,
  ApikeyStatus,
  getApikeys,
  getApikeysCount,
} from '@/shared/models/apikey';
import { getUserInfo } from '@/shared/models/user';
import { Button } from '@/shared/types/blocks/common';
import { type Table } from '@/shared/types/blocks/table';

export default async function ApiKeysPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: number; pageSize?: number }>;
}) {
  const { page: pageNum, pageSize } = await searchParams;
  const page = pageNum || 1;
  const limit = pageSize || 20;

  const user = await getUserInfo();
  if (!user) {
    return <Empty message="no auth" />;
  }

  const t = await getTranslations('settings.apikeys');

  const total = await getApikeysCount({
    userId: user.id,
    status: ApikeyStatus.ACTIVE,
  });

  const apikeys = await getApikeys({
    userId: user.id,
    status: ApikeyStatus.ACTIVE,
    page,
    limit,
  });

  const table: Table = {
    title: t('list.title'),
    columns: [
      {
        name: 'title',
        title: t('fields.title'),
      },
      { name: 'key', title: t('fields.key'), type: 'copy' },
      {
        name: 'createdAt',
        title: t('fields.created_at'),
        type: 'time',
      },
      {
        name: 'action',
        title: t('fields.action'),
        type: 'dropdown',
        callback: (item: Apikey) => {
          return [
            {
              title: t('list.buttons.edit'),
              url: `/settings/apikeys/${item.id}/edit`,
              icon: 'RiEditLine',
            },
            {
              title: t('list.buttons.delete'),
              url: `/settings/apikeys/${item.id}/delete`,
              icon: 'RiDeleteBinLine',
            },
          ];
        },
      },
    ],
    data: apikeys,
    emptyMessage: t('list.empty_message'),
    pagination: {
      total,
      page,
      limit,
    },
  };

  const buttons: Button[] = [
    {
      title: t('list.buttons.add'),
      url: '/settings/apikeys/create',
      icon: 'Plus',
    },
  ];

  return (
    <div className="space-y-8">
      <TableCard title={t('list.title')} buttons={buttons} table={table} />
    </div>
  );
}
