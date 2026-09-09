'use client';

import { SidebarTrigger } from '@/shared/components/ui/sidebar';
import { useChatContext } from '@/shared/contexts/chat';

export function ChatHeader() {
  const { chat } = useChatContext();

  return (
    <header className="bg-background border-border sticky top-0 z-10 flex w-full items-center gap-2 border-b px-4 py-3">
      <SidebarTrigger className="size-7" />
      <h1 className="text-sm font-normal">{chat?.title}</h1>
    </header>
  );
}
