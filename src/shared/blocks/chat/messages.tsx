'use client';

import { Fragment, useEffect, useRef } from 'react';
import { UIMessage, UseChatHelpers } from '@ai-sdk/react';
import { CopyIcon, RefreshCcwIcon } from 'lucide-react';

import { Action, Actions } from '@/shared/components/ai-elements/actions';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/shared/components/ai-elements/conversation';
import { Loader } from '@/shared/components/ai-elements/loader';
import {
  Message,
  MessageContent,
} from '@/shared/components/ai-elements/message';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/shared/components/ai-elements/reasoning';
import { Response } from '@/shared/components/ai-elements/response';
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from '@/shared/components/ai-elements/sources';
import { cn } from '@/shared/lib/utils';

export function ChatMessages({
  chatInstance,
}: {
  chatInstance: UseChatHelpers<UIMessage>;
}) {
  const { messages, status, regenerate } = chatInstance;
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  return (
    <Conversation className="h-full">
      <ConversationContent>
        {messages.map((message) => {
          const metadata =
            message.metadata && typeof message.metadata === 'object'
              ? (message.metadata as { type?: string })
              : undefined;
          const isAssistantError =
            message.role === 'assistant' && metadata?.type === 'error';

          return (
            <div key={message.id}>
              {message.role === 'assistant' &&
                message.parts.filter((part) => part.type === 'source-url')
                  .length > 0 && (
                  <Sources>
                    <SourcesTrigger
                      count={
                        message.parts.filter(
                          (part) => part.type === 'source-url'
                        ).length
                      }
                    />
                    {message.parts
                      .filter((part) => part.type === 'source-url')
                      .map((part, i) => (
                        <SourcesContent key={`${message.id}-${i}`}>
                          <Source
                            key={`${message.id}-${i}`}
                            href={part.url}
                            title={part.url}
                          />
                        </SourcesContent>
                      ))}
                  </Sources>
                )}
              {message.parts.map((part, i) => {
                switch (part.type) {
                  case 'text':
                    return (
                      <Fragment key={`${message.id}-${i}`}>
                        <Message from={message.role}>
                          <MessageContent>
                            <Response
                              className={cn(
                                isAssistantError && 'text-destructive'
                              )}
                            >
                              {part.text}
                            </Response>
                          </MessageContent>
                        </Message>
                        {message.role === 'assistant' &&
                          i === messages.length - 1 && (
                            <Actions className="mt-2">
                              <Action
                                onClick={() => regenerate()}
                                label="Retry"
                              >
                                <RefreshCcwIcon className="size-3" />
                              </Action>
                              <Action
                                onClick={() =>
                                  navigator.clipboard.writeText(part.text)
                                }
                                label="Copy"
                              >
                                <CopyIcon className="size-3" />
                              </Action>
                            </Actions>
                          )}
                      </Fragment>
                    );
                  case 'reasoning':
                    return (
                      <Reasoning
                        key={`${message.id}-${i}`}
                        className="w-full"
                        isStreaming={
                          status === 'streaming' &&
                          i === message.parts.length - 1 &&
                          message.id === messages.at(-1)?.id
                        }
                      >
                        <ReasoningTrigger />
                        <ReasoningContent>{part.text}</ReasoningContent>
                      </Reasoning>
                    );
                  default:
                    return null;
                }
              })}
            </div>
          );
        })}
        {status === 'submitted' && <Loader />}
        <div ref={endOfMessagesRef} />
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
