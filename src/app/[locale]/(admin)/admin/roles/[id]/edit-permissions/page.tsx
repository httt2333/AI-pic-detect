import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PERMISSIONS, requirePermission } from '@/core/rbac';
import { Empty } from '@/shared/blocks/common';
import { Header, Main, MainHeader } from '@/shared/blocks/dashboard';
import { FormCard } from '@/shared/blocks/form';
import {
  assignPermissionsToRole,
  getPermissions,
  getRoleById,
  getRolePermissions,
} from '@/shared/services/rbac';
import { Crumb } from '@/shared/types/blocks/common';
import { Form } from '@/shared/types/blocks/form';

export default async function RoleEditPermissionsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  // Check if user has permission to edit posts
  await requirePermission({
    code: PERMISSIONS.ROLES_WRITE,
    redirectUrl: '/admin/no-permission',
    locale,
  });

  const role = await getRoleById(id);
  if (!role) {
    return <Empty message="Role not found" />;
  }

  const t = await getTranslations('admin.roles');

  const crumbs: Crumb[] = [
    { title: t('edit_permissions.crumbs.admin'), url: '/admin' },
    { title: t('edit_permissions.crumbs.roles'), url: '/admin/roles' },
    { title: t('edit_permissions.crumbs.edit_permissions'), is_active: true },
  ];

  const permissions = await getPermissions();
  const permissionsOptions = permissions.map((permission) => ({
    title: permission.title,
    description: permission.code,
    value: permission.id,
  }));

  const rolePermissions = await getRolePermissions(role.id as string);
  const rolePermissionIds = rolePermissions.map((permission) => permission.id);

  const form: Form = {
    fields: [
      {
        name: 'name',
        type: 'text',
        title: t('fields.name'),
        validation: { required: true },
        attributes: { disabled: true },
      },
      {
        name: 'title',
        type: 'text',
        title: t('fields.title'),
        validation: { required: true },
        attributes: { disabled: true },
      },
      {
        name: 'permissions',
        type: 'checkbox',
        title: t('fields.permissions'),
        options: permissionsOptions,
        validation: { required: true },
      },
    ],
    passby: {
      role: role,
    },
    data: {
      ...role,
      permissions: rolePermissionIds,
    },
    submit: {
      button: {
        title: t('edit_permissions.buttons.submit'),
      },
      handler: async (data, passby) => {
        'use server';

        const { role } = passby;

        if (!role) {
          throw new Error('no auth');
        }

        let permissions = data.get('permissions') as unknown as string[];
        if (typeof permissions === 'string') {
          try {
            permissions = JSON.parse(permissions);
          } catch (error) {
            throw new Error('invalid permissions');
          }
        }

        await assignPermissionsToRole(role.id as string, permissions);

        return {
          status: 'success',
          message: 'permissions updated',
          redirect_url: '/admin/roles',
        };
      },
    },
  };

  return (
    <>
      <Header crumbs={crumbs} />
      <Main>
        <MainHeader title={t('edit_permissions.title')} />
        <FormCard form={form} className="md:max-w-xl" />
      </Main>
    </>
  );
}
