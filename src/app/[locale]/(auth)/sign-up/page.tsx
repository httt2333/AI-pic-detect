import { getTranslations } from 'next-intl/server';

import { envConfigs } from '@/config';
import { defaultLocale } from '@/config/locale';
import { redirect } from '@/core/i18n/navigation';
import { SignUp } from '@/shared/blocks/sign/sign-up';
import { getConfigs } from '@/shared/models/config';
import { getSignUser } from '@/shared/models/user';

function safeInternalPath(raw?: string) {
  if (!raw) return '/';
  if (!raw.startsWith('/')) return '/';
  return raw;
}

function stripLocalePrefix(path: string, locale: string) {
  if (!path?.startsWith('/')) return '/';
  if (locale === defaultLocale) return path;
  if (path === `/${locale}`) return '/';
  if (path.startsWith(`/${locale}/`)) return path.slice(locale.length + 1) || '/';
  return path;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const t = await getTranslations('common');

  return {
    title: `${t('sign.sign_up_title')} - ${t('metadata.title')}`,
    alternates: {
      canonical:
        locale !== defaultLocale
          ? `${envConfigs.app_url}/${locale}/sign-up`
          : `${envConfigs.app_url}/sign-up`,
    },
  };
}

export default async function SignUpPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
  params: Promise<{ locale: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const { locale } = await params;

  // If user is already signed in, don't show sign-up form again.
  const sessionUser = await getSignUser();
  if (sessionUser) {
    const target = stripLocalePrefix(safeInternalPath(callbackUrl), locale);
    redirect({ href: target || '/', locale });
  }

  const configs = await getConfigs();

  return <SignUp configs={configs} callbackUrl={callbackUrl || '/'} />;
}
