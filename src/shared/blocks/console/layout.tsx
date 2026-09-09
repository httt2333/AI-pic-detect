'use client';

import { ReactNode, useState } from 'react';

import { Link, usePathname } from '@/core/i18n/navigation';
import { SmartIcon } from '@/shared/blocks/common/smart-icon';
import { Button } from '@/shared/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/components/ui/sheet';
import { Nav } from '@/shared/types/blocks/common';

export function ConsoleLayout({
  title,
  description,
  nav,
  topNav,
  className,
  children,
}: {
  title?: string;
  description?: string;
  nav?: Nav;
  topNav?: Nav;
  className?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const filteredItems = nav?.items.filter((item) =>
    item.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderNavItems = () => (
    <nav className="space-y-1">
      {filteredItems?.map((item, idx) => (
        <Link
          key={idx}
          href={item.url || ''}
          className={`flex items-center space-x-3 rounded-md px-3 py-2 text-sm transition-colors ${
            item.is_active ||
            pathname.endsWith(item.url as string) ||
            item.url?.endsWith(pathname)
              ? 'bg-secondary text-secondary-foreground font-medium'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
          }`}
        >
          <SmartIcon name={item.icon as string} size={16} />
          <span>{item.title}</span>
        </Link>
      ))}
    </nav>
  );

  return (
    <div className={`bg-background min-h-screen ${className}`}>
      {/* Top Navigation */}
      {topNav && (
        <div className="border-border border-b">
          <div className="container">
            <nav className="scrollbar-hide flex items-center gap-4 overflow-x-auto py-0 text-sm">
              {topNav.items.map((item, idx) => (
                <Link
                  key={idx}
                  href={item.url || ''}
                  className={`text-muted-foreground hover:bg-foreground/10 flex shrink-0 items-center gap-2 px-3 py-2 ${
                    item.is_active || pathname?.startsWith(item.url as string)
                      ? 'border-primary text-muted-foreground border-b-2'
                      : ''
                  } hover:text-foreground duration-200 ease-linear`}
                >
                  {item.icon && (
                    <SmartIcon name={item.icon as string} size={16} />
                  )}
                  {item.title}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="border-border">
        <div className="container">
          <div className="flex items-center gap-4 py-8">
            {/* Mobile Menu Trigger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                  <SmartIcon name="Menu" size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 px-4">
                <SheetHeader className="mb-4 px-0">
                  <SheetTitle>{title || 'Menu'}</SheetTitle>
                </SheetHeader>
                {renderNavItems()}
              </SheetContent>
            </Sheet>

            <h1 className="text-foreground text-2xl font-semibold md:text-3xl">
              {title}
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container">
        <div className="flex flex-wrap gap-8 py-8">
          {/* Left Sidebar (Desktop) */}
          <div className="hidden w-64 flex-shrink-0 md:block">
            {/* Search Box */}
            {/* <div className="relative mb-6">
              <SmartIcon
                name="Search"
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div> */}

            {/* Navigation Menu */}
            {renderNavItems()}
          </div>

          {/* Right Content Area */}
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
