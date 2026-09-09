'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { authClient, useSession } from '@/core/auth/client';
import { useRouter } from '@/core/i18n/navigation';
import { defaultLocale } from '@/config/locale';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';

const RESEND_COOLDOWN_SECONDS = 60;

function safeDecodeCallbackUrl(raw?: string) {
  if (!raw) return '/';
  try {
    const decoded = decodeURIComponent(raw);
    // only allow internal redirects
    if (decoded.startsWith('/')) return decoded;
    return '/';
  } catch {
    return '/';
  }
}

function stripLocalePrefix(path: string, locale: string) {
  if (!path?.startsWith('/')) return '/';
  if (locale === defaultLocale) return path;
  if (path === `/${locale}`) return '/';
  if (path.startsWith(`/${locale}/`))
    return path.slice(locale.length + 1) || '/';
  return path;
}

function getCooldownKey(email?: string) {
  return `verify-email:lastSentAt:${String(email || '').toLowerCase()}`;
}

function getCooldownRemainingSeconds(email?: string) {
  if (typeof window === 'undefined') return 0;
  if (!email) return 0;
  const raw = window.localStorage.getItem(getCooldownKey(email));
  const last = raw ? Number(raw) : 0;
  if (!last || Number.isNaN(last)) return 0;
  const elapsedSeconds = Math.floor((Date.now() - last) / 1000);
  return Math.max(0, RESEND_COOLDOWN_SECONDS - elapsedSeconds);
}

function markSentNow(email?: string) {
  if (typeof window === 'undefined') return;
  if (!email) return;
  try {
    window.localStorage.setItem(getCooldownKey(email), String(Date.now()));
  } catch {
    // ignore
  }
}

export function VerifyEmailPage({
  email,
  callbackUrl,
  sent,
}: {
  email?: string;
  callbackUrl?: string;
  sent?: string;
}) {
  const t = useTranslations('common.sign');
  const router = useRouter();
  const locale = useLocale();
  const { data: session, isPending } = useSession();
  const [loading, setLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const lastSessionCheckAtRef = useRef(0);

  const nextUrl = useMemo(() => {
    const decoded = safeDecodeCallbackUrl(callbackUrl);
    // i18n router will prefix locale automatically; store locale-less paths
    return stripLocalePrefix(decoded, locale);
  }, [callbackUrl, locale]);
  const base = locale !== defaultLocale ? `/${locale}` : '';
  const signInPath = useMemo(() => {
    const query = new URLSearchParams();
    query.set('callbackUrl', nextUrl || '/');
    // Back to sign-in should allow users to sign in with a different account.
    // Do not include email/verify flags that would show "verification sent" hints.
    return `/sign-in?${query.toString()}`;
  }, [email, nextUrl]);

  const hardNavigateToSignIn = (prefillEmail?: string) => {
    if (typeof window === 'undefined') return;
    const query = new URLSearchParams();
    if (prefillEmail) query.set('email', prefillEmail);
    query.set('callbackUrl', nextUrl || '/');
    window.location.assign(`${base}/sign-in?${query.toString()}`);
  };

  // Initialize & tick cooldown
  useEffect(() => {
    setCooldownSeconds(getCooldownRemainingSeconds(email));

    const timer = window.setInterval(() => {
      setCooldownSeconds(getCooldownRemainingSeconds(email));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [email]);

  const hardNavigateToNextUrl = () => {
    if (typeof window === 'undefined') return;
    // Force a full navigation so server components read the latest cookies/session.
    window.location.assign(`${base}${nextUrl}`);
  };

  const checkSessionAndRedirect = async () => {
    // Avoid spamming get-session (especially since we also poll cooldown timer).
    const now = Date.now();
    if (now - lastSessionCheckAtRef.current < 800) return;
    lastSessionCheckAtRef.current = now;

    try {
      const { data } = await authClient.getSession();
      if (data?.user) {
        hardNavigateToNextUrl();
      }
    } catch {
      // ignore
    }
  };

  // If verification email link signs the user in successfully, session will exist.
  useEffect(() => {
    // In verify-email page, if a session exists we consider the user already signed in.
    // Always redirect to callbackUrl (or '/') regardless of which email this page is "waiting" for.
    if (!isPending && session?.user) {
      hardNavigateToNextUrl();
    }
  }, [isPending, session?.user, nextUrl, router]);

  // On initial mount, actively fetch session once (and briefly poll) to catch
  // the common flow: user clicks verification link -> cookie gets set -> redirected here.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 12; // ~12s

    const tick = async () => {
      if (cancelled) return;
      attempts += 1;
      await checkSessionAndRedirect();
      if (attempts >= maxAttempts) return;
      // keep polling only while we're not signed in yet
      const { data } = await authClient.getSession();
      if (!data?.user) {
        window.setTimeout(tick, 1000);
      }
    };

    void tick();

    return () => {
      cancelled = true;
    };
  }, [nextUrl]);

  // Cross-tab session sync: when user verifies/logs in in another tab,
  // this tab should detect the new session without a full refresh.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onFocus = () => {
      void checkSessionAndRedirect();
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void checkSessionAndRedirect();
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [nextUrl]);

  useEffect(() => {
    if (sent === '1') {
      // Only mark "sent" if we don't already have a cooldown running.
      // This avoids "resetting" the timer when users switch language (query preserved)
      // or refresh the page while `sent=1` is still present.
      if (getCooldownRemainingSeconds(email) === 0) {
        markSentNow(email);
      }
      setCooldownSeconds(getCooldownRemainingSeconds(email));

      // Remove `sent=1` from the URL to avoid re-triggering on locale switch/refresh.
      if (typeof window !== 'undefined') {
        try {
          const url = new URL(window.location.href);
          url.searchParams.delete('sent');
          window.history.replaceState({}, '', url.toString());
        } catch {
          // ignore
        }
      }
    }
  }, [sent, t, email]);

  const handleResend = async () => {
    if (!email) {
      toast.error('email is required');
      return;
    }
    if (loading) return;

    const remaining = getCooldownRemainingSeconds(email);
    if (remaining > 0) {
      return;
    }

    try {
      setLoading(true);
      const result = await authClient.sendVerificationEmail({
        email,
        // IMPORTANT: callbackURL must not contain its own '&' query params.
        // After verification, send user to callbackUrl (or home). This page is just the waiting UI.
        callbackURL: `${base}${nextUrl || '/'}`,
      });
      if (result?.error) {
        toast.error(result.error.message || 'send verification email failed');
        return;
      }
      markSentNow(email);
      setCooldownSeconds(getCooldownRemainingSeconds(email));
    } catch (e: any) {
      toast.error(e?.message || 'send verification email failed');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (session?.user) {
      hardNavigateToNextUrl();
      return;
    }
    // Force a fresh session check (e.g. user verified in another tab).
    void (async () => {
      await checkSessionAndRedirect();
      const { data } = await authClient.getSession();
      if (!data?.user) {
        // If user verified in a different browser (no shared cookies),
        // we can detect verified status and redirect them to sign-in.
        const targetEmail = String(email || '')
          .trim()
          .toLowerCase();
        if (targetEmail) {
          try {
            const res = await fetch('/api/user/is-email-verified', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ email: targetEmail }),
            });
            const json = await res.json().catch(() => null);
            const verified = Boolean(json?.data?.emailVerified);
            if (verified) {
              hardNavigateToSignIn(targetEmail);
              return;
            }
          } catch {
            // ignore
          }
        }

        toast.error(t('verify_email_not_verified_yet'));
      }
    })();
  };

  return (
    <Card className="mx-auto w-full md:max-w-md">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">
          <h1>{t('verify_email_page_title')}</h1>
        </CardTitle>
        <CardDescription className="text-xs md:text-sm">
          <h2>
            {t('verify_email_page_description')}
            {email ? ` ${email}` : ''}
          </h2>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={loading || cooldownSeconds > 0}
            onClick={handleResend}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : cooldownSeconds > 0 ? (
              t('resend_verification_countdown', { seconds: cooldownSeconds })
            ) : (
              t('resend_verification')
            )}
          </Button>

          <Button
            type="button"
            className="w-full"
            disabled={isPending}
            onClick={handleContinue}
          >
            {isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              t('verify_email_continue')
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => router.push(signInPath)}
          >
            {t('back_to_sign_in')}
          </Button>
        </div>
      </CardContent>
      <CardFooter>
        <p className="w-full text-center text-xs text-neutral-500">
          {t('verify_email_tip')}
        </p>
      </CardFooter>
    </Card>
  );
}
