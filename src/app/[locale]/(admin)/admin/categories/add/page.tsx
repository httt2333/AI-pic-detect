import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PERMISSIONS, requirePermission } from '@/core/rbac';
import { Header, Main, MainHeader } from '@/shared/blocks/dashboard';
import { FormCard } from '@/shared/blocks/form';
import { getUuid } from '@/shared/lib/hash';
import {
  addTaxonomy,
  NewTaxonomy,
  TaxonomyStatus,
  TaxonomyType,
} from '@/shared/models/taxonomy';
import { getUserInfo } from '@/shared/models/user';
import { Crumb } from '@/shared/types/blocks/common';
import { Form } from '@/shared/types/blocks/form';

export default async function CategoryAddPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Check if user has permission to add categories
  await requirePermission({
    code: PERMISSIONS.CATEGORIES_WRITE,
    redirectUrl: '/admin/no-permission',
    locale,
  });

  const t = await getTranslations('admin.categories');

  const crumbs: Crumb[] = [
    { title: t('add.crumbs.admin'), url: '/admin' },
    { title: t('add.crumbs.categories'), url: '/admin/categories' },
    { title: t('add.crumbs.add'), is_active: true },
  ];

  const form: Form = {
    fields: [
      {
        name: 'slug',
        type: 'text',
        title: t('fields.slug'),
        tip: 'unique slug for the category',
        validation: { required: true },
      },
      {
        name: 'title',
        type: 'text',
        title: t('fields.title'),
        validation: { required: true },
      },
      {
        name: 'description',
        type: 'textarea',
        title: t('fields.description'),
      },
    ],
    passby: {
      type: 'category',
    },
    data: {},
    submit: {
      button: {
        title: t('add.buttons.submit'),
      },
      handler: async (data, passby) => {
        'use server';

        const user = await getUserInfo();
        if (!user) {
          throw new Error('no auth');
        }

        const slug = data.get('slug') as string;
        const title = data.get('title') as string;
        const description = data.get('description') as string;

        if (!slug?.trim() || !title?.trim()) {
          throw new Error('slug and title are required');
        }

        const newCategory: NewTaxonomy = {
          id: getUuid(),
          userId: user.id,
          parentId: '', // todo: select parent category
          slug: slug.trim().toLowerCase(),
          type: TaxonomyType.CATEGORY,
          title: title.trim(),
          description: description.trim(),
          image: '',
          icon: '',
          status: TaxonomyStatus.PUBLISHED,
        };

        const result = await addTaxonomy(newCategory);

        if (!result) {
          throw new Error('add category failed');
        }

        return {
          status: 'success',
          message: 'category added',
          redirect_url: '/admin/categories',
        };
      },
    },
  };

  return (
    <>
      <Header crumbs={crumbs} />
      <Main>
        <MainHeader title={t('add.title')} />
        <FormCard form={form} className="md:max-w-xl" />
      </Main>
    </>
  );
}
