import { getTranslations } from 'next-intl/server';

import { PERMISSIONS, requirePermission } from '@/core/rbac';
import { Header, Main, MainHeader } from '@/shared/blocks/dashboard';
import { TableCard } from '@/shared/blocks/table';
import { getRoles, Role } from '@/shared/services/rbac';
import { Crumb } from '@/shared/types/blocks/common';
import { type Table } from '@/shared/types/blocks/table';

export default async function AdminRolesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Check if user has permission to read users
  await requirePermission({
    code: PERMISSIONS.ROLES_READ,
    redirectUrl: `/admin/no-permission`,
    locale,
  });

  const roles = await getRoles();

  const t = await getTranslations('admin.roles');

  const crumbs: Crumb[] = [
    { title: t('list.crumbs.admin'), url: '/admin' },
    { title: t('list.crumbs.roles'), is_active: true },
  ];

  const table: Table = {
    columns: [
      { name: 'name', title: t('fields.name') },
      { name: 'title', title: t('fields.title') },
      { name: 'description', title: t('fields.description'), type: 'copy' },
      { name: 'status', title: t('fields.status'), type: 'label' },
      { name: 'createdAt', title: t('fields.created_at'), type: 'time' },
      {
        name: 'actions',
        title: t('fields.actions'),
        type: 'dropdown',
        callback: (item: Role) => [
          {
            name: 'edit',
            title: t('list.buttons.edit'),
            icon: 'RiEditLine',
            url: `/admin/roles/${item.id}/edit`,
          },
          {
            name: 'edit_permissions',
            title: t('list.buttons.edit_permissions'),
            icon: 'RiEditLine',
            url: `/admin/roles/${item.id}/edit-permissions`,
          },
        ],
      },
    ],
    data: roles,
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
