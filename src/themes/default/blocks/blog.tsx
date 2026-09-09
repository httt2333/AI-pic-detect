import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar';
import { Calendar } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/core/i18n/navigation';
import { Tabs } from '@/shared/blocks/common/tabs';
import { cn } from '@/shared/lib/utils';
import {
  Category as CategoryType,
  Post as PostType,
} from '@/shared/types/blocks/blog';
import { Tab } from '@/shared/types/blocks/common';
import { Section } from '@/shared/types/blocks/landing';

export function Blog({
  section,
  className,
  categories,
  currentCategory,
  posts,
}: {
  section: Section;
  className?: string;
  categories: CategoryType[];
  currentCategory: CategoryType;
  posts: PostType[];
}) {
  const t = useTranslations('pages.blog.messages');
  const tabs: Tab[] = [];
  categories?.map((category: CategoryType) => {
    tabs.push({
      name: category.slug,
      title: category.title,
      url:
        !category.slug || category.slug === 'all'
          ? '/blog'
          : `/blog/category/${category.slug}`,
      is_active: currentCategory?.slug == category.slug,
    });
  });

  return (
    <section
      id={section.id}
      className={cn('py-24 md:py-36', section.className, className)}
    >
      <div className="mx-auto mb-12 text-center">
        {section.sr_only_title && (
          <h1 className="sr-only">{section.sr_only_title}</h1>
        )}
        <h2 className="mb-6 text-3xl font-bold text-pretty lg:text-4xl">
          {section.title}
        </h2>
        <p className="text-muted-foreground mb-4 max-w-xl lg:max-w-none lg:text-lg">
          {section.description}
        </p>
      </div>

      <div className="container flex flex-col items-center gap-8 lg:px-16">
        {categories && categories.length > 0 && (
          <div className="mb-2 flex flex-wrap items-center justify-center gap-4">
            <Tabs tabs={tabs} />
          </div>
        )}

        {posts && posts.length > 0 ? (
          <div className="flex w-full flex-wrap items-start">
            {posts?.map((item, idx) => (
              <Link
                key={idx}
                href={item.url || ''}
                target={item.target || '_self'}
                className="w-full p-4 md:w-1/3"
              >
                <div className="border-border flex flex-col overflow-clip rounded-xl border">
                  {item.image && (
                    <div>
                      <img
                        src={item.image}
                        alt={item.title || ''}
                        className="aspect-16/9 h-full w-full object-cover object-center"
                      />
                    </div>
                  )}
                  <div className="px-4 py-4 md:px-4 md:py-4 lg:px-4 lg:py-4">
                    <h3 className="mb-3 text-lg font-semibold md:mb-4 md:text-xl lg:mb-6">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground mb-3 md:mb-4 lg:mb-6">
                      {item.description}
                    </p>

                    <div className="text-muted-foreground flex items-center text-xs">
                      {item.created_at && (
                        <div className="flex items-center gap-2">
                          <Calendar className="size-4" />
                          {item.created_at}
                        </div>
                      )}
                      <div className="flex-1"></div>
                      {(item.author_name || item.author_image) && (
                        <div className="flex items-center gap-2">
                          {item.author_image && (
                            <Avatar>
                              <AvatarImage
                                src={item.author_image || ''}
                                alt={item.author_name || ''}
                                className="size-6 rounded-full"
                              />
                              <AvatarFallback>
                                {item.author_name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          {item.author_name}
                        </div>
                      )}
                    </div>

                    {/* {blog.readMoreText && (
                      <p className="flex items-center hover:underline">
                        {blog.readMoreText}
                        <ArrowRight className="ml-2 size-4" />
                      </p>
                    )} */}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground text-md py-8">
            {t('no_content')}
          </div>
        )}
      </div>
    </section>
  );
}
