'use client';

import { Link } from '@/core/i18n/navigation';
import { SmartIcon } from '@/shared/blocks/common';
import { Button } from '@/shared/components/ui/button';
import { useSidebar } from '@/shared/components/ui/sidebar';
import { cn } from '@/shared/lib/utils';
import { Button as ButtonType } from '@/shared/types/blocks/common';

export function SidebarButtons({ buttons }: { buttons: ButtonType[] }) {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <div className="flex flex-col gap-2 px-3 py-3">
      {buttons.map((button, idx) => (
        <Button
          key={idx}
          asChild
          variant={button.variant || 'outline'}
          size={button.size || 'default'}
          className={cn(
            isCollapsed
              ? 'h-6 w-6 justify-center p-0 [&_svg]:size-4 [&_svg]:shrink-0'
              : undefined
          )}
        >
          <Link
            href={button.url || ''}
            target={button.target || '_self'}
            aria-label={button.title || undefined}
            title={button.title || undefined}
          >
            {button.icon && (
              <SmartIcon
                name={button.icon as string}
                className="size-4 shrink-0"
              />
            )}
            {button.title && !isCollapsed && (
              <span className="whitespace-nowrap">{button.title}</span>
            )}
          </Link>
        </Button>
      ))}
    </div>
  );
}
