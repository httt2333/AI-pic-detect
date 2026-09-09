import { getTranslations } from 'next-intl/server';

import { PERMISSIONS, requirePermission } from '@/core/rbac';
import { Header, Main, MainHeader } from '@/shared/blocks/dashboard';
import { TableCard } from '@/shared/blocks/table';
import { Badge } from '@/shared/components/ui/badge';
import { getRemainingCredits } from '@/shared/models/credit';
import { getUsers, getUsersCount, User } from '@/shared/models/user';
import { getUserRoles } from '@/shared/services/rbac';
import { Crumb, Search } from '@/shared/types/blocks/common';
import { type Table } from '@/shared/types/blocks/table';

export default async function AdminUsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    page?: number;
    pageSize?: number;
    email?: string;
  }>;
}) {
  const { locale } = await params;

  // Check if user has permission to read users
  await requirePermission({
    code: PERMISSIONS.USERS_READ,
    redirectUrl: '/admin/no-permission',
    locale,
  });

  const t = await getTranslations('admin.users');

  const { page: pageNum, pageSize, email } = await searchParams;
  const page = pageNum || 1;
  const limit = pageSize || 30;

  const total = await getUsersCount({
    email,
  });
  const users = await getUsers({
    email,
    page,
    limit,
  });

  const crumbs: Crumb[] = [
    { title: t('list.crumbs.admin'), url: '/admin' },
    { title: t('list.crumbs.users'), is_active: true },
  ];

  const search: Search = {
    name: 'email',
    title: t('list.search.email.title'),
    placeholder: t('list.search.email.placeholder'),
    value: email,
  };

  const table: Table = {
    columns: [
      { name: 'id', title: t('fields.id'), type: 'copy' },
      { name: 'name', title: t('fields.name') },
      {
        name: 'image',
        title: t('fields.avatar'),
        type: 'image',
        placeholder: '-',
      },
      { name: 'email', title: t('fields.email'), type: 'copy' },
      {
        name: 'roles',
        title: t('fields.roles'),
        callback: async (item: User) => {
          const roles = await getUserRoles(item.id);

          return (
            <div className="flex flex-col gap-2">
              {roles.map((role) => (
                <Badge key={role.id} variant="outline">
                  {role.title}
                </Badge>
              ))}
            </div>
          );
        },
      },
      {
        name: 'emailVerified',
        title: t('fields.email_verified'),
        type: 'label',
        placeholder: '-',
      },
      {
        name: 'remainingCredits',
        title: t('fields.remaining_credits'),
        callback: async (item: User) => {
          const credits = await getRemainingCredits(item.id);

          return <div className="text-green-500">{credits}</div>;
        },
      },
      { name: 'createdAt', title: t('fields.created_at'), type: 'time' },
      { name: 'ip', title: t('fields.ip'), type: 'copy' },
      { name: 'locale', title: t('fields.locale') },
      { name: 'utmSource', title: t('fields.utm_source') },
      {
        name: 'actions',
        title: t('fields.actions'),
        type: 'dropdown',
        callback: (item: User) => [
          {
            name: 'edit',
            title: t('list.buttons.edit'),
            icon: 'RiEditLine',
            url: `/admin/users/${item.id}/edit`,
          },
          {
            name: 'edit-roles',
            title: t('list.buttons.edit_roles'),
            icon: 'Users',
            url: `/admin/users/${item.id}/edit-roles`,
          },
          {
            name: 'grant-credits',
            title: t('list.buttons.grant_credits'),
            icon: 'Coins',
            url: `/admin/users/${item.id}/grant-credits`,
          },
        ],
      },
    ],
    data: users,
    pagination: {
      total,
      page,
      limit,
    },
  };

  return (
    <>
      <Header crumbs={crumbs} />
      <Main>
        <MainHeader title={t('list.title')} search={search} />
        <TableCard table={table} />
      </Main>
    </>
  );
}
