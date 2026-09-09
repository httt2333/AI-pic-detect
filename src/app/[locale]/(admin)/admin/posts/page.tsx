import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PERMISSIONS, requirePermission } from '@/core/rbac';
import { Header, Main, MainHeader } from '@/shared/blocks/dashboard';
import { TableCard } from '@/shared/blocks/table';
import { getPosts, getPostsCount, Post, PostType } from '@/shared/models/post';
import { getTaxonomies } from '@/shared/models/taxonomy';
import { Button, Crumb } from '@/shared/types/blocks/common';
import { type Table } from '@/shared/types/blocks/table';

export default async function PostsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: number; pageSize?: number }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Check if user has permission to read posts
  await requirePermission({
    code: PERMISSIONS.POSTS_READ,
    redirectUrl: '/admin/no-permission',
    locale,
  });

  const { page: pageNum, pageSize } = await searchParams;
  const page = pageNum || 1;
  const limit = pageSize || 30;

  const t = await getTranslations('admin.posts');

  const crumbs: Crumb[] = [
    { title: t('list.crumbs.admin'), url: '/admin' },
    { title: t('list.crumbs.posts'), is_active: true },
  ];

  const total = await getPostsCount({
    type: PostType.ARTICLE,
  });

  const posts = await getPosts({
    type: PostType.ARTICLE,
    page,
    limit,
  });

  const table: Table = {
    columns: [
      { name: 'title', title: t('fields.title') },
      { name: 'authorName', title: t('fields.author_name') },
      {
        name: 'image',
        title: t('fields.image'),
        type: 'image',
        metadata: {
          width: 100,
          height: 80,
        },
        className: 'rounded-md',
      },
      {
        name: 'categories',
        title: t('fields.categories'),
        callback: async (item: Post) => {
          if (!item.categories) {
            return '-';
          }
          const categoriesIds = item.categories.split(',');
          const categories = await getTaxonomies({
            ids: categoriesIds,
          });
          if (!categories) {
            return '-';
          }

          const categoriesNames = categories.map((category) => {
            return category.title;
          });

          return categoriesNames.join(', ');
        },
      },
      { name: 'createdAt', title: t('fields.created_at'), type: 'time' },
      {
        name: 'action',
        title: '',
        type: 'dropdown',
        callback: (item: Post) => {
          return [
            {
              name: 'edit',
              title: t('list.buttons.edit'),
              icon: 'RiEditLine',
              url: `/admin/posts/${item.id}/edit`,
            },
            {
              name: 'view',
              title: t('list.buttons.view'),
              icon: 'RiEyeLine',
              url: `/blog/${item.slug}`,
              target: '_blank',
            },
          ];
        },
      },
    ],
    data: posts,
    pagination: {
      total,
      page,
      limit,
    },
  };

  const actions: Button[] = [
    {
      id: 'add',
      title: t('list.buttons.add'),
      icon: 'RiAddLine',
      url: '/admin/posts/add',
    },
  ];

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
