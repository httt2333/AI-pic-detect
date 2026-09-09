'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { UIMessage } from 'ai';

import { ChatBox } from '@/shared/blocks/chat/box';
import { Loader } from '@/shared/components/ai-elements/loader';
import { Chat } from '@/shared/types/chat';

export default function ChatPage() {
  const params = useParams();

  const [initialChat, setInitialChat] = useState<Chat | null>(null);
  const [initialMessages, setInitialMessages] = useState<UIMessage[] | null>(
    null
  );

  const fetchChat = async (chatId: string) => {
    try {
      const resp = await fetch('/api/chat/info', {
        method: 'POST',
        body: JSON.stringify({ chatId }),
      });
      if (!resp.ok) {
        throw new Error(`request failed with status: ${resp.status}`);
      }
      const { code, message, data } = await resp.json();
      if (code !== 0) {
        throw new Error(message);
      }

      setInitialChat({
        id: data.id,
        title: data.title,
        createdAt: data.createdAt,
        model: data.model,
        provider: data.provider,
        parts: data.parts ? JSON.parse(data.parts) : [],
        metadata: data.metadata ? JSON.parse(data.metadata) : undefined,
        content: data.content ? JSON.parse(data.content) : undefined,
      } as Chat);

      if (data.id) {
        fetchMessages(data.id);
      }
    } catch (e: any) {
      console.log('fetch chat failed:', e);
    }
  };

  const fetchMessages = async (chatId: string) => {
    try {
      const resp = await fetch('/api/chat/messages', {
        method: 'POST',
        body: JSON.stringify({ chatId, page: 1, limit: 100 }),
      });
      if (!resp.ok) {
        throw new Error(`request failed with status: ${resp.status}`);
      }
      const { code, message, data } = await resp.json();
      if (code !== 0) {
        throw new Error(message);
      }

      const { list } = data;
      setInitialMessages(
        list.map((item: any) => ({
          id: item.id,
          role: item.role,
          parts: item.parts ? JSON.parse(item.parts) : [],
          metadata: item.metadata ? JSON.parse(item.metadata) : undefined,
        })) as UIMessage[]
      );
    } catch (e: any) {
      console.log('fetch messages failed:', e);
    }
  };

  useEffect(() => {
    fetchChat(params.id as string);
  }, [params.id]);

  return initialChat && initialMessages ? (
    <ChatBox initialChat={initialChat} initialMessages={initialMessages} />
  ) : (
    <div className="flex h-screen items-center justify-center p-8">
      <Loader />
    </div>
  );
}
