import { ChevronRight } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { SmartIcon } from '@/shared/blocks/common';
import { NavItem } from '@/shared/types/blocks/common';

export function Crumb({ items }: { items: NavItem[] }) {
  return (
    <nav className="text-muted-foreground flex items-center text-sm md:px-3">
      {items.map((item, index) => {
        const isActive = item.is_active;
        return (
          <div key={index} className="flex items-center">
            <Link
              href={item.url || ''}
              className={`hover:text-foreground line-clamp-1 flex min-w-8 items-center gap-2 transition-colors ${
                isActive ? 'text-primary hover:text-primary font-medium' : ''
              }`}
            >
              {item.icon && (
                <SmartIcon name={item.icon as string} className="size-4" />
              )}
              {item.title}
            </Link>

            {!isActive && (
              <ChevronRight className="text-muted-foreground/40 mx-2 h-4 w-4" />
            )}
          </div>
        );
      })}
    </nav>
  );
}
