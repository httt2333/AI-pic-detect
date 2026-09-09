import { getTranslations, setRequestLocale } from 'next-intl/server';

import { getThemePage } from '@/core/theme';
import { getMetadata } from '@/shared/lib/seo';
import {
  getLocalPostsAndCategories,
  PostType as PostDataType,
} from '@/shared/models/post';
import { Post as PostType } from '@/shared/types/blocks/blog';
import { DynamicPage } from '@/shared/types/blocks/landing';

export const revalidate = 3600;

export const generateMetadata = getMetadata({
  metadataKey: 'pages.updates.metadata',
  canonicalUrl: '/updates',
});

export default async function UpdatesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // load updates data
  const t = await getTranslations('pages.updates');

  let posts: PostType[] = [];

  try {
    const { posts: allPosts } = await getLocalPostsAndCategories({
      locale,
      type: PostDataType.LOG,
      postPrefix: '/updates/',
    });

    posts = allPosts
      // sort posts by date desc
      .sort((a, b) => {
        const dateA = new Date(a.date || '').getTime();
        const dateB = new Date(b.date || '').getTime();
        return dateB - dateA;
      })
      // sort posts by created_at desc
      .sort((a, b) => {
        const createdAtA = new Date(a.created_at || '').getTime();
        const createdAtB = new Date(b.created_at || '').getTime();
        return createdAtB - createdAtA;
      })
      // sort posts by version desc
      .sort((a, b) => {
        const versionA = a.version || '';
        const versionB = b.version || '';
        return versionB.localeCompare(versionA);
      });
  } catch (error) {
    console.log('getting posts failed:', error);
  }

  // build page sections
  const page: DynamicPage = {
    sections: {
      updates: {
        ...t.raw('page.sections.updates'),
        data: {
          posts,
        },
      },
    },
  };

  // load page component
  const Page = await getThemePage('dynamic-page');

  return <Page locale={locale} page={page} />;
}
