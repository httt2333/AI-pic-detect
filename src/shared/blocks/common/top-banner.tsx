'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { Button } from '@/shared/components/ui/button';
import { cacheGet, cacheSet } from '@/shared/lib/cache';
import { getTimestamp } from '@/shared/lib/time';
import { cn } from '@/shared/lib/utils';

type TopBannerLinkTarget = '_self' | '_blank';

export type TopBannerProps = {
  enabled?: boolean;
  /**
   * Used to build the dismiss cache key. Change it when you change the banner.
   */
  id?: string;
  /**
   * Banner main text.
   */
  text: ReactNode;
  /**
   * CTA button text. When omitted, the button is hidden.
   */
  buttonText?: string;
  /**
   * CTA link. When provided, clicking the button navigates to this URL.
   */
  href?: string;
  /**
   * Open the link in a new tab. Defaults to false.
   */
  target?: TopBannerLinkTarget;
  /**
   * Whether the banner can be dismissed. Defaults to true.
   */
  closable?: boolean;
  /**
   * Remember dismiss state in cache. Defaults to true.
   */
  rememberDismiss?: boolean;
  /**
   * Dismiss expiry in days. Defaults to 7.
   */
  dismissedExpiryDays?: number;
  /**
   * Extra class names for the banner wrapper.
   */
  className?: string;
  /**
   * Optional callback when user clicks the CTA and no `href` is provided.
   */
  onAction?: () => void;
};

function isExternalHref(href: string) {
  return (
    /^https?:\/\//i.test(href) || /^mailto:/i.test(href) || /^tel:/i.test(href)
  );
}

export function TopBanner({
  enabled = true,
  id = 'default',
  text,
  buttonText,
  href,
  target = '_self',
  closable = true,
  rememberDismiss = true,
  dismissedExpiryDays = 7,
  className,
  onAction,
}: TopBannerProps) {
  const dismissKey = useMemo(() => `top-banner-dismissed:${id}`, [id]);

  const [showBanner, setShowBanner] = useState(false);
  const [bannerHeight, setBannerHeight] = useState(0);
  const bannerRef = useRef<HTMLDivElement>(null);
  const hasCheckedRef = useRef(false);

  const isDismissed = (): boolean => {
    if (!rememberDismiss) return false;
    return Boolean(cacheGet(dismissKey));
  };

  const setDismissed = () => {
    if (!rememberDismiss) return;
    const expiresAt = getTimestamp() + dismissedExpiryDays * 24 * 60 * 60;
    cacheSet(dismissKey, 'true', expiresAt);
  };

  useEffect(() => {
    // Only run initial check once to avoid flicker in strict mode / rerenders
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    if (!enabled) return;
    if (isDismissed()) return;

    setShowBanner(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Adjust header and layout spacing when banner visibility changes
  useEffect(() => {
    if (showBanner && bannerRef.current) {
      const bannerHeight = bannerRef.current.offsetHeight;
      setBannerHeight(bannerHeight);

      const header = document.querySelector('header');
      if (header) {
        header.style.top = `${bannerHeight}px`;
      }

      const sidebarContainer = document.querySelector(
        '[data-slot="sidebar-container"]'
      );
      if (sidebarContainer) {
        (sidebarContainer as HTMLElement).style.top = `${bannerHeight}px`;
        (sidebarContainer as HTMLElement).style.height =
          `calc(100vh - ${bannerHeight}px)`;
      }

      const sidebarWrapper = document.querySelector(
        '[data-slot="sidebar-wrapper"]'
      );
      if (sidebarWrapper) {
        (sidebarWrapper as HTMLElement).style.paddingTop = `${bannerHeight}px`;
      }
    } else {
      setBannerHeight(0);
    }

    return () => {
      const header = document.querySelector('header');
      if (header) {
        header.style.top = '0px';
      }

      const sidebarContainer = document.querySelector(
        '[data-slot="sidebar-container"]'
      );
      if (sidebarContainer) {
        (sidebarContainer as HTMLElement).style.top = '0px';
        (sidebarContainer as HTMLElement).style.height = '100vh';
      }

      const sidebarWrapper = document.querySelector(
        '[data-slot="sidebar-wrapper"]'
      );
      if (sidebarWrapper) {
        (sidebarWrapper as HTMLElement).style.paddingTop = '0px';
      }
    };
  }, [showBanner]);

  useEffect(() => {
    if (!showBanner || !bannerRef.current) return;

    const updateHeight = () => {
      if (bannerRef.current) {
        setBannerHeight(bannerRef.current.offsetHeight);
      }
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(bannerRef.current);

    window.addEventListener('resize', updateHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, [showBanner]);

  const handleDismiss = () => {
    setDismissed();
    setShowBanner(false);
    setBannerHeight(0);

    const header = document.querySelector('header');
    if (header) {
      header.style.top = '0px';
    }

    const sidebarContainer = document.querySelector(
      '[data-slot="sidebar-container"]'
    );
    if (sidebarContainer) {
      (sidebarContainer as HTMLElement).style.top = '0px';
      (sidebarContainer as HTMLElement).style.height = '100vh';
    }

    const sidebarWrapper = document.querySelector(
      '[data-slot="sidebar-wrapper"]'
    );
    if (sidebarWrapper) {
      (sidebarWrapper as HTMLElement).style.paddingTop = '0px';
    }
  };

  if (!enabled || !showBanner) {
    return null;
  }

  const showButton =
    Boolean(buttonText) && (Boolean(href) || Boolean(onAction));

  return (
    <>
      <div
        ref={bannerRef}
        className={cn(
          'from-primary to-primary text-primary-foreground fixed top-0 right-0 left-0 z-[51] hidden min-h-12 bg-gradient-to-r py-1 shadow-lg md:block',
          className
        )}
      >
        <div className="container py-2.5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-1 items-center justify-center gap-3">
              <div
                className="text-sm"
                dangerouslySetInnerHTML={{ __html: String(text ?? '') }}
              />
            </div>

            <div className="flex flex-shrink-0 items-center gap-2">
              {showButton ? (
                href ? (
                  isExternalHref(href) ? (
                    <Button
                      asChild
                      variant="secondary"
                      size="sm"
                      className="bg-background text-xs"
                    >
                      <a
                        href={href}
                        target={target}
                        rel={
                          target === '_blank'
                            ? 'noreferrer noopener'
                            : undefined
                        }
                      >
                        {buttonText}
                      </a>
                    </Button>
                  ) : (
                    <Button
                      asChild
                      variant="secondary"
                      size="sm"
                      className="bg-background text-xs"
                    >
                      <Link href={href}>{buttonText}</Link>
                    </Button>
                  )
                ) : (
                  <Button
                    onClick={onAction}
                    variant="secondary"
                    size="sm"
                    className="bg-background text-xs"
                  >
                    {buttonText}
                  </Button>
                )
              ) : null}

              {closable ? (
                <button
                  onClick={handleDismiss}
                  className="bg-primary/10 flex-shrink-0 rounded p-1 transition-colors"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        style={{ height: bannerHeight }}
        className="pointer-events-none"
      />
    </>
  );
}
