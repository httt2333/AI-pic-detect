'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  IconDots,
  IconFolder,
  IconMessageCircle,
  IconPencil,
  IconShare3,
  IconTrash,
  type Icon,
} from '@tabler/icons-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/core/i18n/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/shared/components/ui/sidebar';
import { useAppContext } from '@/shared/contexts/app';
import { useChatContext } from '@/shared/contexts/chat';

export function ChatLibrary({}) {
  const { isMobile } = useSidebar();

  const t = useTranslations('ai.chat.library');
  const params = useParams();

  const { user } = useAppContext();

  const { chats, setChats } = useChatContext();
  const [hasMore, setHasMore] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const fetchChats = async ({
    page,
    limit,
  }: {
    page: number;
    limit: number;
  }) => {
    try {
      const resp = await fetch('/api/chat/list', {
        method: 'POST',
        body: JSON.stringify({ page, limit }),
      });
      if (!resp.ok) {
        throw new Error(`fetch chats failed with status: ${resp.status}`);
      }
      const { code, message, data } = await resp.json();
      if (code !== 0) {
        throw new Error(message);
      }

      const { list, hasMore } = data;

      setChats(list);
      setHasMore(hasMore);
    } catch (e: any) {
      console.log('fetch chats failed:', e);
      return [];
    }
  };

  useEffect(() => {
    if (user) {
      fetchChats({ page, limit });
    }
  }, [user]);

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>{t('title')}</SidebarGroupLabel>
      <SidebarMenu>
        {chats.length > 0 &&
          chats.slice(0, limit).map((chat) => (
            <SidebarMenuItem key={chat.id}>
              <SidebarMenuButton
                asChild
                className={
                  params.id === chat.id
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : ''
                }
              >
                <Link href={`/chat/${chat.id}`}>
                  <IconMessageCircle className="text-sidebar-foreground/70" />
                  <span>{chat.title}</span>
                </Link>
              </SidebarMenuButton>
              {/* <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction
                    showOnHover
                    className="data-[state=open]:bg-accent rounded-sm"
                  >
                    <IconDots />
                    <span className="sr-only">{t('more')}</span>
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-24 rounded-lg"
                  side={isMobile ? 'bottom' : 'right'}
                  align={isMobile ? 'end' : 'start'}
                >
                  <DropdownMenuItem>
                    <IconPencil />
                    <span>{t('actions.edit_title')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <IconShare3 />
                    <span>{t('actions.share')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive">
                    <IconTrash />
                    <span>{t('actions.delete')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu> */}
            </SidebarMenuItem>
          ))}

        {hasMore && (
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/chat/history">
                <IconDots className="text-sidebar-foreground/70" />
                <span>{t('more')}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
