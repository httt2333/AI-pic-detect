import { getTranslations } from 'next-intl/server';

import { PaymentType } from '@/extensions/payment/types';
import { Empty } from '@/shared/blocks/common';
import { TableCard } from '@/shared/blocks/table';
import {
  getOrders,
  getOrdersCount,
  Order,
  OrderStatus,
} from '@/shared/models/order';
import { getUserInfo } from '@/shared/models/user';
import { Tab } from '@/shared/types/blocks/common';
import { type Table } from '@/shared/types/blocks/table';

export default async function PaymentsPage({
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

  const t = await getTranslations('settings.payments');

  const total = await getOrdersCount({
    paymentType: type as PaymentType,
    userId: user.id,
    status: OrderStatus.PAID,
  });

  const orders = await getOrders({
    paymentType: type as PaymentType,
    userId: user.id,
    status: OrderStatus.PAID,
    page,
    limit,
  });

  const table: Table = {
    title: t('list.title'),
    columns: [
      { name: 'orderNo', title: t('fields.order_no'), type: 'copy' },
      { name: 'productName', title: t('fields.product_name') },
      {
        name: 'status',
        title: t('fields.status'),
        type: 'label',
        metadata: { variant: 'outline' },
      },
      {
        name: 'paymentType',
        title: t('fields.type'),
        type: 'label',
        metadata: { variant: 'outline' },
      },
      {
        title: t('fields.price'),
        callback: function (item) {
          const currency = (item.currency || 'USD').toUpperCase();

          let prefix = '';
          if (currency === 'USD') {
            prefix = `$`;
          } else if (currency === 'EUR') {
            prefix = `€`;
          } else if (currency === 'CNY') {
            prefix = `¥`;
          } else {
            prefix = `${currency} `;
          }

          return (
            <div className="text-primary">{`${prefix}${item.amount / 100}`}</div>
          );
        },
      },
      {
        title: t('fields.paid_amount'),
        callback: function (item) {
          const currency = (item.paymentCurrency || 'USD').toUpperCase();

          let prefix = '';
          if (currency === 'USD') {
            prefix = `$`;
          } else if (currency === 'EUR') {
            prefix = `€`;
          } else if (currency === 'CNY') {
            prefix = `¥`;
          } else {
            prefix = `${currency} `;
          }

          return (
            <div className="text-primary">{`${prefix}${item.paymentAmount / 100}`}</div>
          );
        },
      },
      {
        title: t('fields.discount_amount'),
        callback: function (item) {
          const currency = (item.discountCurrency || 'USD').toUpperCase();

          let prefix = '';
          if (currency === 'USD') {
            prefix = `$`;
          } else if (currency === 'EUR') {
            prefix = `€`;
          } else if (currency === 'CNY') {
            prefix = `¥`;
          } else {
            prefix = `${currency} `;
          }

          return (
            <div className="text-primary">{`${prefix}${item.discountAmount / 100}`}</div>
          );
        },
      },
      {
        name: 'createdAt',
        title: t('fields.created_at'),
        type: 'time',
      },
      {
        name: 'actions',
        type: 'dropdown',
        callback: (item: Order) => {
          if (item.invoiceUrl) {
            return [
              {
                title: t('fields.actions.view_invoice'),
                url: item.invoiceUrl,
                target: '_blank',
                icon: 'ArrowUpRight',
              },
            ];
          } else if (item.invoiceId) {
            return [
              {
                title: t('fields.actions.view_invoice'),
                url: `/settings/invoices/retrieve?order_no=${item.orderNo}`,
                icon: 'ArrowUpRight',
              },
            ];
          }
        },
      },
    ],
    data: orders,
    pagination: {
      total,
      page,
      limit,
    },
  };

  const tabs: Tab[] = [
    {
      title: t('list.tabs.all'),
      name: 'all',
      url: '/settings/payments',
      is_active: !type || type === 'all',
    },
    {
      title: t('list.tabs.one-time'),
      name: 'one-time',
      url: '/settings/payments?type=one-time',
      is_active: type === 'one-time',
    },
    {
      title: t('list.tabs.subscription'),
      name: 'subscription',
      url: '/settings/payments?type=subscription',
      is_active: type === 'subscription',
    },
    {
      title: t('list.tabs.renew'),
      name: 'renew',
      url: '/settings/payments?type=renew',
      is_active: type === 'renew',
    },
  ];

  return (
    <div className="space-y-8">
      <TableCard
        title={t('list.title')}
        description={t('list.description')}
        tabs={tabs}
        table={table}
      />
    </div>
  );
}
