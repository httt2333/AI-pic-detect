'use client';

import { TOCItems, TOCProvider } from 'fumadocs-ui/components/layout/toc';
import { CalendarIcon, ListIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { MarkdownPreview } from '@/shared/blocks/common';
import { Crumb } from '@/shared/blocks/common/crumb';
import { type Post as PostType } from '@/shared/types/blocks/blog';
import { NavItem } from '@/shared/types/blocks/common';

import '@/config/style/docs.css';

export function BlogDetail({ post }: { post: PostType }) {
  const t = useTranslations('pages.blog.messages');

  const crumbItems: NavItem[] = [
    {
      title: t('crumb'),
      url: '/blog',
      icon: 'Newspaper',
      is_active: false,
    },
    {
      title: post.title || '',
      url: `/blog/${post.slug}`,
      is_active: true,
    },
  ];

  // Check if TOC should be shown
  const showToc = post.toc && post.toc.length > 0;

  // Check if Author info should be shown
  const showAuthor = post.author_name || post.author_image || post.author_role;

  // Calculate main content column span based on what sidebars are shown
  const getMainColSpan = () => {
    if (showToc && showAuthor) return 'lg:col-span-6';
    if (showToc || showAuthor) return 'lg:col-span-9';
    return 'lg:col-span-12';
  };

  return (
    <TOCProvider toc={post.toc || []}>
      <section id={post.id}>
        <div className="py-24 md:py-32">
          <div className="mx-auto w-full max-w-7xl px-6 md:px-8">
            <Crumb items={crumbItems} />

            {/* Header Section */}
            <div className="mt-16 text-center">
              <h1 className="text-foreground mx-auto mb-4 w-full text-3xl font-bold md:max-w-4xl md:text-4xl">
                {post.title}
              </h1>
              <div className="text-muted-foreground text-md mb-8 flex items-center justify-center gap-4">
                {post.created_at && (
                  <div className="text-muted-foreground text-md mb-8 flex items-center justify-center gap-2">
                    <CalendarIcon className="size-4" /> {post.created_at}
                  </div>
                )}
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-8 md:mt-12 lg:grid-cols-12">
              {/* Table of Contents - Left Sidebar */}
              {showToc && (
                <div className="lg:col-span-3">
                  <div className="sticky top-24 hidden md:block">
                    <div className="bg-muted/30 rounded-lg p-4">
                      <h2 className="text-foreground mb-4 flex items-center gap-2 font-semibold">
                        <ListIcon className="size-4" /> {t('toc')}
                      </h2>
                      <TOCItems />
                    </div>
                  </div>
                </div>
              )}

              {/* Main Content - Center */}
              <div className={getMainColSpan()}>
                <article className="p-0">
                  {post.body ? (
                    <div className="docs text-foreground text-md space-y-4 font-normal *:leading-relaxed">
                      {post.body}
                    </div>
                  ) : (
                    post.content && (
                      <div className="prose prose-lg text-muted-foreground max-w-none space-y-6 *:leading-relaxed">
                        <MarkdownPreview content={post.content} />
                      </div>
                    )
                  )}
                </article>
              </div>

              {/* Author Info - Right Sidebar */}
              {showAuthor && (
                <div className="lg:col-span-3">
                  <div className="sticky top-24">
                    <div className="bg-muted/30 rounded-lg p-6">
                      <div className="text-center">
                        {post.author_image && (
                          <div className="ring-foreground/10 mx-auto mb-4 aspect-square size-20 overflow-hidden rounded-xl border border-transparent shadow-md ring-1 shadow-black/15">
                            <img
                              src={post.author_image}
                              alt={post.author_name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        {post.author_name && (
                          <p className="text-foreground mb-1 text-lg font-semibold">
                            {post.author_name}
                          </p>
                        )}
                        {post.author_role && (
                          <p className="text-muted-foreground mb-4 text-sm">
                            {post.author_role}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </TOCProvider>
  );
}
