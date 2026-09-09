'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';

import { usePathname, useRouter } from '@/core/i18n/navigation';
import { envConfigs } from '@/config';
import { localeNames, locales } from '@/config/locale';
import { Button } from '@/shared/components/ui/button';
import { cacheGet, cacheSet } from '@/shared/lib/cache';
import { getTimestamp } from '@/shared/lib/time';

const DISMISSED_KEY = 'locale-suggestion-dismissed';
const DISMISSED_EXPIRY_DAYS = 1; // Expiry in days
const PREFERRED_LOCALE_KEY = 'locale';

export function LocaleDetector() {
  if (envConfigs.locale_detect_enabled !== 'true') {
    return null;
  }

  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showBanner, setShowBanner] = useState(false);
  const [browserLocale, setBrowserLocale] = useState<string | null>(null);
  const [bannerHeight, setBannerHeight] = useState(0);
  const bannerRef = useRef<HTMLDivElement>(null);
  const hasCheckedRef = useRef(false);

  const detectBrowserLocale = (): string | null => {
    if (typeof window === 'undefined') return null;

    const browserLang = navigator.language || (navigator as any).userLanguage;
    const langCode = browserLang.split('-')[0].toLowerCase();

    // Check if the detected language is in our supported locales
    if (locales.includes(langCode)) {
      return langCode;
    }

    return null;
  };

  const isDismissed = (): boolean => {
    const dismissedData = cacheGet(DISMISSED_KEY);
    if (!dismissedData) return false;

    return true;
  };

  const setDismissed = () => {
    const expiresAt = getTimestamp() + DISMISSED_EXPIRY_DAYS * 24 * 60 * 60;
    cacheSet(DISMISSED_KEY, 'true', expiresAt);
  };

  const switchToLocale = useCallback(
    (locale: string) => {
      const query = searchParams?.toString?.() ?? '';
      const href = query ? `${pathname}?${query}` : pathname;
      router.replace(href, { locale });
      cacheSet(PREFERRED_LOCALE_KEY, locale);
      setShowBanner(false);
    },
    [router, pathname, searchParams]
  );

  useEffect(() => {
    // Only run initial check once to avoid interference with manual locale switches
    if (hasCheckedRef.current) {
      return;
    }

    hasCheckedRef.current = true;

    // Get browser locale
    const detectedLocale = detectBrowserLocale();
    setBrowserLocale(detectedLocale);

    // Check if user has dismissed the banner or already set a preference
    const dismissed = isDismissed();
    const preferredLocale = cacheGet(PREFERRED_LOCALE_KEY);

    // If user has previously clicked to switch locale, auto-switch to that preference
    if (
      preferredLocale &&
      preferredLocale !== currentLocale &&
      locales.includes(preferredLocale)
    ) {
      switchToLocale(preferredLocale);
      return;
    }

    // Show banner if:
    // 1. Browser locale is different from current locale
    // 2. User hasn't dismissed the banner (or dismissal has expired)
    // 3. Browser locale is supported
    // 4. User hasn't set a preference yet (no auto-switch, only show banner)
    if (
      detectedLocale &&
      detectedLocale !== currentLocale &&
      !dismissed &&
      !preferredLocale
    ) {
      setShowBanner(true);
    }
  }, [currentLocale, switchToLocale]);

  // Adjust header and layout spacing when banner visibility changes
  useEffect(() => {
    if (showBanner && bannerRef.current) {
      const bannerHeight = bannerRef.current.offsetHeight;

      setBannerHeight(bannerHeight);

      // Adjust header if exists
      const header = document.querySelector('header');
      if (header) {
        header.style.top = `${bannerHeight}px`;
      }

      // Adjust sidebar container (fixed positioned sidebar)
      const sidebarContainer = document.querySelector(
        '[data-slot="sidebar-container"]'
      );
      if (sidebarContainer) {
        (sidebarContainer as HTMLElement).style.top = `${bannerHeight}px`;
        (sidebarContainer as HTMLElement).style.height =
          `calc(100vh - ${bannerHeight}px)`;
      }

      // Adjust sidebar wrapper (for dashboard/sidebar layouts)
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
      // Reset positions when component unmounts or banner is hidden
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
    if (!showBanner || !bannerRef.current) {
      return;
    }

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

  const handleSwitch = () => {
    if (browserLocale) {
      switchToLocale(browserLocale);
    }
  };

  const handleDismiss = () => {
    setDismissed();
    setShowBanner(false);
    setBannerHeight(0);

    // Reset header position
    const header = document.querySelector('header');
    if (header) {
      header.style.top = '0px';
    }

    // Reset sidebar container
    const sidebarContainer = document.querySelector(
      '[data-slot="sidebar-container"]'
    );
    if (sidebarContainer) {
      (sidebarContainer as HTMLElement).style.top = '0px';
      (sidebarContainer as HTMLElement).style.height = '100vh';
    }

    // Reset sidebar wrapper padding
    const sidebarWrapper = document.querySelector(
      '[data-slot="sidebar-wrapper"]'
    );
    if (sidebarWrapper) {
      (sidebarWrapper as HTMLElement).style.paddingTop = '0px';
    }
  };

  const targetLocaleName =
    localeNames[browserLocale as keyof typeof localeNames] || browserLocale;

  if (!showBanner || !browserLocale) {
    return null;
  }

  return (
    <>
      <div
        ref={bannerRef}
        className="from-primary to-primary/80 text-primary-foreground fixed top-0 right-0 left-0 z-[51] hidden bg-gradient-to-r shadow-lg md:block"
      >
        <div className="container py-2.5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3">
              <span className="text-sm">
                {browserLocale === 'zh'
                  ? `检测到浏览器语言是: ${targetLocaleName}，是否切换？`
                  : `We detected your browser language is ${targetLocaleName}. Switch to it?`}
              </span>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              <Button
                onClick={handleSwitch}
                variant="secondary"
                size="sm"
                className="bg-background text-xs"
              >
                {browserLocale === 'zh' ? '切换到中文' : 'Switch'}
              </Button>
              <button
                onClick={handleDismiss}
                className="bg-primary/10 flex-shrink-0 rounded p-1 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
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
