import { getTranslations } from 'next-intl/server';

import { Empty } from '@/shared/blocks/common';
import { TableCard } from '@/shared/blocks/table';
import {
  Chat,
  ChatStatus,
  getChats,
  getChatsCount,
} from '@/shared/models/chat';
import { getUserInfo } from '@/shared/models/user';
import { Button, Tab } from '@/shared/types/blocks/common';
import { type Table } from '@/shared/types/blocks/table';

export default async function ChatsPage({
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

  const t = await getTranslations('activity.chats');

  const chats = await getChats({
    userId: user.id,
    page,
    limit,
  });

  const total = await getChatsCount({
    userId: user.id,
  });

  const table: Table = {
    title: t('list.title'),
    columns: [
      { name: 'title', title: t('fields.title'), type: 'copy' },
      // { name: 'status', title: t('fields.status'), type: 'label' },
      { name: 'model', title: t('fields.model'), type: 'label' },
      { name: 'provider', title: t('fields.provider'), type: 'label' },
      { name: 'createdAt', title: t('fields.created_at'), type: 'time' },
      {
        name: 'action',
        title: t('fields.action'),
        type: 'dropdown',
        callback: (item: Chat) => {
          const items: Button[] = [
            {
              title: t('list.buttons.view'),
              url: `/chat/${item.id}`,
              target: '_blank',
              icon: 'RiEyeLine',
            },
          ];

          return items;
        },
      },
    ],
    data: chats,
    emptyMessage: t('list.empty_message'),
    pagination: {
      total,
      page,
      limit,
    },
  };

  const buttons: Button[] = [
    {
      title: t('list.buttons.new'),
      url: '/chat',
      target: '_blank',
      icon: 'Plus',
    },
  ];

  return (
    <div className="space-y-8">
      <TableCard title={t('list.title')} table={table} buttons={buttons} />
    </div>
  );
}
