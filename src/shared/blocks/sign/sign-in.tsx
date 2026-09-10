'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { authClient, signIn } from '@/core/auth/client';
import { Link, useRouter } from '@/core/i18n/navigation';
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
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';

import { SocialProviders } from './social-providers';

export function SignIn({
  configs,
  callbackUrl = '/',
  defaultEmail = '',
}: {
  configs: Record<string, string>;
  callbackUrl: string;
  defaultEmail?: string;
}) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('common.sign');
  const [email, setEmail] = useState(defaultEmail || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const isGoogleAuthEnabled = configs.google_auth_enabled === 'true';
  const isGithubAuthEnabled = configs.github_auth_enabled === 'true';
  const isEmailAuthEnabled =
    configs.email_auth_enabled !== 'false' ||
    (!isGoogleAuthEnabled && !isGithubAuthEnabled); // no social providers enabled, auto enable email auth

  if (callbackUrl) {
    if (
      locale !== defaultLocale &&
      callbackUrl.startsWith('/') &&
      !callbackUrl.startsWith(`/${locale}`)
    ) {
      callbackUrl = `/${locale}${callbackUrl}`;
    }
  }

  const base = locale !== defaultLocale ? `/${locale}` : '';
  const stripLocalePrefix = (path: string) => {
    if (!path?.startsWith('/')) return '/';
    if (locale === defaultLocale) return path;
    if (path === `/${locale}`) return '/';
    if (path.startsWith(`/${locale}/`))
      return path.slice(locale.length + 1) || '/';
    return path;
  };

  const handleSignIn = async () => {
    if (loading) {
      return;
    }

    if (!email || !password) {
      toast.error('请输入邮箱和密码');
      return;
    }

    // Set loading immediately to avoid duplicate submits before request hooks fire.
    setLoading(true);

    try {
      await signIn.email(
        {
          email,
          password,
          callbackURL: callbackUrl,
        },
        {
          onRequest: () => {
            // loading is already set above; keep as no-op for safety
          },
          onResponse: () => {
            // Do NOT reset loading here; navigation may not have completed yet.
          },
          onSuccess: () => {
            // Keep loading=true until navigation completes.
          },
          onError: (e) => {
            const status = e?.error?.status;
            if (status === 403) {
              const normalizedCallbackUrl = stripLocalePrefix(callbackUrl);
              const verifyPath = `/verify-email?sent=1&email=${encodeURIComponent(
                email
              )}&callbackUrl=${encodeURIComponent(normalizedCallbackUrl)}`;

              // IMPORTANT:
              // better-auth does not URL-encode callbackURL when generating the verification URL.
              // So callbackURL must not contain its own '&' query params (or they'll get split).
              // We send users to home/callbackUrl after verification, and keep the verify page only
              // as the waiting UI.
              void authClient.sendVerificationEmail({
                email,
                callbackURL: `${base}${normalizedCallbackUrl || '/'}`,
              });

              // i18n router will prefix locale automatically; do NOT include locale here.
              router.push(verifyPath);
              return;
            }

            toast.error(e?.error?.message || '登录失败，请稍后重试');
            setLoading(false);
          },
        }
      );
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : '登录失败，请稍后重试'
      );
      setLoading(false);
    }
  };

  return (
    <Card className="mx-auto w-full rounded-2xl border-violet-100 bg-white shadow-xl shadow-violet-950/5 md:max-w-md">
      <CardHeader className="space-y-3 px-6 pt-7 sm:px-8 sm:pt-8">
        <CardTitle className="text-2xl font-semibold tracking-[-0.03em] text-violet-950 md:text-3xl">
          <h1>{t('sign_in_title')}</h1>
        </CardTitle>
        <CardDescription className="text-sm leading-6 text-violet-950/60">
          <h2>{t('sign_in_description')}</h2>
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 sm:px-8">
        <div className="grid gap-4">
          {isEmailAuthEnabled && (
            <form
              className="grid gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                void handleSignIn();
              }}
            >
              <div className="grid gap-2">
                <Label htmlFor="email">{t('email_title')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('email_placeholder')}
                  required
                  onChange={(e) => {
                    setEmail(e.target.value);
                  }}
                  value={email}
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">{t('password_title')}</Label>
                  {/* <Link
                    href="#"
                    className="ml-auto inline-block text-sm underline"
                  >
                    Forgot your password?
                  </Link> */}
                </div>

                <Input
                  id="password"
                  type="password"
                  placeholder={t('password_placeholder')}
                  autoComplete="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              onClick={() => {
                setRememberMe(!rememberMe);
              }}
            />
            <Label htmlFor="remember">Remember me</Label>
          </div> */}

              <Button
                type="submit"
                className="h-11 w-full bg-violet-800 font-semibold text-white hover:bg-violet-950"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <p> {t('sign_in_title')} </p>
                )}
              </Button>
            </form>
          )}

          <SocialProviders
            configs={configs}
            callbackUrl={callbackUrl || '/'}
            loading={loading}
            setLoading={setLoading}
          />
        </div>
      </CardContent>
      {isEmailAuthEnabled && (
        <CardFooter className="px-6 pb-3 sm:px-8">
          <div className="flex w-full justify-center border-t border-violet-100 py-5">
            <p className="text-center text-sm text-violet-950/60">
              {t('no_account')}
              <Link href="/sign-up" className="ml-1 font-semibold text-violet-800 underline underline-offset-4">
                <span className="cursor-pointer">
                  {t('sign_up_title')}
                </span>
              </Link>
            </p>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
