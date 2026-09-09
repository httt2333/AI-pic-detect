'use client';

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { IconHistory } from '@tabler/icons-react';
import moment from 'moment';
import { useLocale, useTranslations } from 'next-intl';

import { Link, usePathname, useRouter } from '@/core/i18n/navigation';
import { LocaleSelector, Pagination } from '@/shared/blocks/common';
import { Empty } from '@/shared/blocks/common/empty';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { SidebarTrigger } from '@/shared/components/ui/sidebar';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { useAppContext } from '@/shared/contexts/app';

type ChatListItem = {
  id: string;
  title?: string | null;
  createdAt?: string | Date | null;
  model?: string | null;
  provider?: string | null;
};

type ChatListResponse = {
  list: ChatListItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

function formatDate(value: string | Date | null | undefined, locale: string) {
  if (!value) {
    return '';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function ChatHistory() {
  const t = useTranslations('ai.chat.history');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isCheckSign } = useAppContext();

  const page = useMemo(() => {
    const value = Number(searchParams.get('page') || '1');
    return Number.isFinite(value) && value > 0 ? value : 1;
  }, [searchParams]);

  const limit = useMemo(() => {
    const value = Number(searchParams.get('limit') || '10');
    return Number.isFinite(value) && value > 0 ? value : 10;
  }, [searchParams]);

  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const totalPages = useMemo(() => {
    if (limit <= 0) {
      return 1;
    }
    const pages = Math.ceil(total / limit);
    return pages > 0 ? pages : 1;
  }, [limit, total]);

  const handlePageChange = useCallback(
    (nextPage: number) => {
      const safePage = Math.min(Math.max(nextPage, 1), totalPages);
      if (safePage === page) {
        return;
      }
      const params = new URLSearchParams(searchParams.toString());
      if (safePage === 1) {
        params.delete('page');
      } else {
        params.set('page', String(safePage));
      }
      params.set('limit', String(limit));
      const queryString = params.toString();
      const target = queryString ? `${pathname}?${queryString}` : pathname;
      router.push(target);
    },
    [limit, page, pathname, router, searchParams, totalPages]
  );

  const handleLimitChange = useCallback(
    (nextLimit: number) => {
      const safeLimit = Math.max(nextLimit, 1);
      const params = new URLSearchParams(searchParams.toString());
      params.set('limit', String(safeLimit));
      params.delete('page');
      const queryString = params.toString();
      const target = queryString ? `${pathname}?${queryString}` : pathname;
      router.push(target);
    },
    [pathname, router, searchParams]
  );

  const fetchChats = useCallback(async () => {
    if (!user) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const resp = await fetch('/api/chat/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ page, limit }),
      });

      if (!resp.ok) {
        throw new Error(`request failed with status ${resp.status}`);
      }

      const json = (await resp.json()) as {
        code: number;
        message?: string;
        data?: ChatListResponse;
      };

      if (json.code !== 0 || !json.data) {
        throw new Error(json.message || 'unknown error');
      }

      setChats(json.data.list || []);
      setTotal(json.data.total || 0);
      setHasMore(Boolean(json.data.hasMore));
    } catch (err) {
      console.error('fetch chat history failed:', err);
      setError(t('error'));
    } finally {
      setLoading(false);
    }
  }, [limit, page, t, user]);

  useEffect(() => {
    if (!user || isCheckSign) {
      return;
    }
    fetchChats();
  }, [fetchChats, isCheckSign, user]);

  useEffect(() => {
    if (
      !loading &&
      user &&
      total > 0 &&
      chats.length === 0 &&
      page > totalPages
    ) {
      handlePageChange(totalPages);
    }
  }, [chats.length, handlePageChange, loading, page, total, totalPages, user]);

  const handleRetry = () => {
    fetchChats();
  };

  const handleLimitSelect = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextLimit = Number(event.target.value);
    if (!Number.isNaN(nextLimit)) {
      handleLimitChange(nextLimit);
    }
  };

  const from = useMemo(() => {
    if (total === 0) {
      return 0;
    }
    return (page - 1) * limit + 1;
  }, [limit, page, total]);

  const to = useMemo(() => {
    if (total === 0) {
      return 0;
    }
    return Math.min(page * limit, total);
  }, [limit, page, total]);

  const renderContent = () => {
    if (isCheckSign) {
      return (
        <div className="flex h-[40vh] items-center justify-center">
          <Skeleton className="h-6 w-40" />
        </div>
      );
    }

    if (!user) {
      return <Empty message={t('signin')} />;
    }

    if (loading) {
      return (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton key={idx} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <p className="text-destructive">{error}</p>
          <Button onClick={handleRetry} variant="outline">
            {t('retry')}
          </Button>
        </div>
      );
    }

    if (chats.length === 0) {
      return <Empty message={t('empty')} />;
    }

    return (
      <ul className="flex flex-col gap-3">
        {chats.map((chat) => (
          <li key={chat.id}>
            <Card className="hover:border-primary/60 p-0 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-2">
                    <Link
                      href={`/chat/${chat.id}`}
                      className="hover:text-primary text-base font-medium transition-colors hover:underline"
                    >
                      {chat.title?.trim() || t('untitled')}
                    </Link>
                    <div className="text-muted-foreground flex items-center gap-2 text-xs">
                      <span>{moment(chat.createdAt).fromNow()}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-2 text-left sm:items-end sm:text-right">
                    <div className="flex flex-wrap items-center gap-2">
                      {chat.model && (
                        <Badge variant="outline" className="">
                          {chat.model}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    );
  };

  const showFooter = user && !loading && chats.length > 0;

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="bg-background sticky top-0 z-10 flex w-full items-center gap-2 px-4 py-3">
        <SidebarTrigger className="size-7" />
        <div className="flex-1" />
        <LocaleSelector />
      </header>
      <main className="flex-1 overflow-y-auto px-6 py-4">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold">{t('title')}</h1>
            <p className="text-muted-foreground text-sm">{t('description')}</p>
          </div>
          <section className="">{renderContent()}</section>
          <div className="px-2 py-4">
            <Pagination page={page} total={total} limit={limit} />
          </div>
        </div>
      </main>
    </div>
  );
}
