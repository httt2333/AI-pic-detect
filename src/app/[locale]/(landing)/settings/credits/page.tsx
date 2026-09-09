import { getTranslations } from 'next-intl/server';

import { Empty } from '@/shared/blocks/common';
import { PanelCard } from '@/shared/blocks/panel';
import { TableCard } from '@/shared/blocks/table';
import {
  Credit,
  CreditStatus,
  CreditTransactionType,
  getCredits,
  getCreditsCount,
  getRemainingCredits,
} from '@/shared/models/credit';
import { getUserInfo } from '@/shared/models/user';
import { Tab } from '@/shared/types/blocks/common';
import { type Table } from '@/shared/types/blocks/table';

export default async function CreditsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: number; pageSize?: number; type?: string }>;
}) {
  const { page: pageNum, pageSize, type } = await searchParams;
  const page = pageNum || 1;
  const limit = pageSize || 20;

  const user = await getUserInfo();
  if (!user) {
    return <Empty message="no auth" />;
  }

  const t = await getTranslations('settings.credits');

  const total = await getCreditsCount({
    transactionType: type as CreditTransactionType,
    userId: user.id,
    status: CreditStatus.ACTIVE,
  });

  const credits = await getCredits({
    userId: user.id,
    status: CreditStatus.ACTIVE,
    transactionType: type as CreditTransactionType,
    page,
    limit,
  });

  const table: Table = {
    title: t('list.title'),
    columns: [
      {
        name: 'transactionNo',
        title: t('fields.transaction_no'),
        type: 'copy',
      },
      { name: 'description', title: t('fields.description') },
      {
        name: 'transactionType',
        title: t('fields.type'),
        type: 'label',
        metadata: { variant: 'outline' },
      },
      {
        name: 'transactionScene',
        title: t('fields.scene'),
        type: 'label',
        placeholder: '-',
        metadata: { variant: 'outline' },
      },
      {
        name: 'credits',
        title: t('fields.credits'),
        type: 'label',
        metadata: { variant: 'outline' },
      },
      {
        name: 'expiresAt',
        title: t('fields.expires_at'),
        type: 'time',
        placeholder: '-',
        metadata: { format: 'YYYY-MM-DD HH:mm:ss' },
      },
      {
        name: 'createdAt',
        title: t('fields.created_at'),
        type: 'time',
      },
    ],
    data: credits,
    pagination: {
      total,
      page,
      limit,
    },
  };

  const remainingCredits = await getRemainingCredits(user.id);

  const tabs: Tab[] = [
    {
      title: t('list.tabs.all'),
      name: 'all',
      url: '/settings/credits',
      is_active: !type || type === 'all',
    },
    {
      title: t('list.tabs.grant'),
      name: 'grant',
      url: '/settings/credits?type=grant',
      is_active: type === 'grant',
    },
    {
      title: t('list.tabs.consume'),
      name: 'consume',
      url: '/settings/credits?type=consume',
      is_active: type === 'consume',
    },
  ];

  return (
    <div className="space-y-8">
      <PanelCard
        title={t('view.title')}
        buttons={[
          {
            title: t('view.buttons.purchase'),
            url: '/pricing',
            target: '_blank',
            icon: 'Coins',
          },
        ]}
        className="max-w-md"
      >
        <div className="text-primary text-3xl font-bold">
          {remainingCredits}
        </div>
      </PanelCard>
      <TableCard title={t('list.title')} tabs={tabs} table={table} />
    </div>
  );
}
