'use client';

import { MoreHorizontal } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { SmartIcon } from '@/shared/blocks/common/smart-icon';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { NavItem } from '@/shared/types/blocks/common';

export function Dropdown({
  value,
  placeholder,
  metadata,
  className,
}: {
  value: NavItem[];
  placeholder?: string;
  metadata: Record<string, any>;
  className?: string;
}) {
  if (!value || value.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="data-[state=open]:bg-muted flex h-8 w-8 p-0"
        >
          <MoreHorizontal />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        {value?.map((item) => {
          return (
            <DropdownMenuItem key={item.title}>
              <Link
                href={item.url || ''}
                target={item.target || '_self'}
                className="flex w-full items-center gap-2"
              >
                {item.icon && (
                  <SmartIcon name={item.icon as string} className="h-4 w-4" />
                )}
                {item.title}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
