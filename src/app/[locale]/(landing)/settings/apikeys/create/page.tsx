import { getTranslations } from 'next-intl/server';

import { Empty } from '@/shared/blocks/common';
import { FormCard } from '@/shared/blocks/form';
import { getNonceStr, getUuid } from '@/shared/lib/hash';
import { ApikeyStatus, createApikey, NewApikey } from '@/shared/models/apikey';
import { getUserInfo } from '@/shared/models/user';
import { Crumb } from '@/shared/types/blocks/common';
import { Form as FormType } from '@/shared/types/blocks/form';

export default async function CreateApiKeyPage() {
  const user = await getUserInfo();
  if (!user) {
    return <Empty message="no auth" />;
  }

  const t = await getTranslations('settings.apikeys');

  const form: FormType = {
    title: t('add.title'),
    fields: [
      {
        name: 'title',
        title: t('fields.title'),
        type: 'text',
        placeholder: '',
        validation: { required: true },
      },
    ],
    passby: {
      user: user,
    },
    submit: {
      handler: async (data: FormData, passby: any) => {
        'use server';

        const { user } = passby;
        if (!user) {
          throw new Error('no auth');
        }

        const title = data.get('title') as string;
        if (!title?.trim()) {
          throw new Error('title is required');
        }

        const key = `sk-${getNonceStr(32)}`;

        const newApikey: NewApikey = {
          id: getUuid(),
          userId: user.id,
          title: title.trim(),
          key: key,
          status: ApikeyStatus.ACTIVE,
        };

        await createApikey(newApikey);

        return {
          status: 'success',
          message: 'API Key created',
          redirect_url: '/settings/apikeys',
        };
      },
      button: {
        title: t('add.buttons.submit'),
      },
    },
  };

  const crumbs: Crumb[] = [
    {
      title: t('add.crumbs.apikeys'),
      url: '/settings/apikeys',
    },
    {
      title: t('add.crumbs.add'),
      is_active: true,
    },
  ];

  return (
    <div className="space-y-8">
      <FormCard title={t('add.title')} crumbs={crumbs} form={form} />
    </div>
  );
}
