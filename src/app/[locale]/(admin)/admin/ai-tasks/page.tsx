import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PERMISSIONS, requirePermission } from '@/core/rbac';
import { Header, Main, MainHeader } from '@/shared/blocks/dashboard';
import { TableCard } from '@/shared/blocks/table';
import { getAITasks, getAITasksCount } from '@/shared/models/ai_task';
import { Button, Crumb, Tab } from '@/shared/types/blocks/common';
import { type Table } from '@/shared/types/blocks/table';

export default async function AiTasksPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: number; pageSize?: number; type?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Check if user has permission to read api keys
  await requirePermission({
    code: PERMISSIONS.AITASKS_READ,
    redirectUrl: '/admin/no-permission',
    locale,
  });

  const t = await getTranslations('admin.ai-tasks');

  const { page: pageNum, pageSize, type } = await searchParams;
  const page = pageNum || 1;
  const limit = pageSize || 30;

  const crumbs: Crumb[] = [
    { title: t('list.crumbs.admin'), url: '/admin' },
    { title: t('list.crumbs.ai-tasks'), is_active: true },
  ];

  const total = await getAITasksCount({
    mediaType: type,
  });

  const aiTasks = await getAITasks({
    getUser: true,
    page,
    limit,
    mediaType: type,
  });

  const table: Table = {
    columns: [
      { name: 'id', title: t('fields.task_id'), type: 'copy' },
      { name: 'createdAt', title: t('fields.created_at'), type: 'time' },
      { name: 'user', title: t('fields.user'), type: 'user' },
      { name: 'status', title: t('fields.status'), type: 'label' },
      { name: 'costCredits', title: t('fields.cost_credits'), type: 'label' },
      { name: 'mediaType', title: t('fields.media_type'), type: 'label' },
      { name: 'scene', title: t('fields.scene'), type: 'label' },
      { name: 'provider', title: t('fields.provider'), type: 'label' },
      { name: 'model', title: t('fields.model'), type: 'label' },
      { name: 'prompt', title: t('fields.prompt'), type: 'copy' },
      { name: 'options', title: t('fields.options'), type: 'json_preview' },
      { name: 'taskResult', title: t('fields.result'), type: 'json_preview' },
    ],
    data: aiTasks,
    pagination: {
      total,
      page,
      limit,
    },
  };

  const actions: Button[] = [];

  const tabs: Tab[] = [
    {
      title: t('list.tabs.all'),
      name: 'all',
      url: '/admin/ai-tasks',
      is_active: true,
    },
    {
      title: t('list.tabs.music'),
      name: 'music',
      url: '/admin/ai-tasks?type=music',
      is_active: false,
    },
    {
      title: t('list.tabs.image'),
      name: 'image',
      url: '/admin/ai-tasks?type=image',
      is_active: false,
    },
    {
      title: t('list.tabs.video'),
      name: 'video',
      url: '/admin/ai-tasks?type=video',
      is_active: false,
    },
    {
      title: t('list.tabs.audio'),
      name: 'audio',
      url: '/admin/ai-tasks?type=audio',
      is_active: false,
    },
    {
      title: t('list.tabs.text'),
      name: 'text',
      url: '/admin/ai-tasks?type=text',
      is_active: false,
    },
  ];

  return (
    <>
      <Header crumbs={crumbs} />
      <Main>
        <MainHeader title={t('list.title')} tabs={tabs} actions={actions} />
        <TableCard table={table} />
      </Main>
    </>
  );
}
