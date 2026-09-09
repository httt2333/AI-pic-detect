'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { ChevronsUpDown, Loader2, LogOut, User } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { signOut, useSession } from '@/core/auth/client';
import { Link, useRouter } from '@/core/i18n/navigation';
import { SmartIcon } from '@/shared/blocks/common';
import { SignModal } from '@/shared/blocks/sign/sign-modal';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/shared/components/ui/sidebar';
import { useAppContext } from '@/shared/contexts/app';
import { User as UserType } from '@/shared/models/user';
import { NavItem } from '@/shared/types/blocks/common';
import { SidebarUser as SidebarUserType } from '@/shared/types/blocks/dashboard';

// SSR/CSR hydration bug fix: Avoid rendering session-dependent UI until mounted on client
export function SidebarUser({ user }: { user: SidebarUserType }) {
  const t = useTranslations('common.sign');
  const { isMobile, open } = useSidebar();
  const router = useRouter();

  // get session (MUST be called unconditionally to keep hook order stable)
  const { data: session, isPending } = useSession();

  // one tap initialized
  const oneTapInitialized = useRef(false);

  // This state will ensure rendering only happens after client hydration
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push(user.signout_callback || '/sign-in');
  };

  // get app context values
  const {
    configs,
    fetchConfigs,
    setIsShowSignModal,
    isCheckSign,
    setIsCheckSign,
    user: authUser,
    setUser,
    fetchUserInfo,
    showOneTap,
  } = useAppContext();

  useEffect(() => {
    fetchConfigs();
  }, []);

  // set is check sign
  useEffect(() => {
    if (!hasMounted) {
      return;
    }

    setIsCheckSign(isPending);
  }, [hasMounted, isPending, setIsCheckSign]);

  // show one tap if not initialized
  useEffect(() => {
    if (!hasMounted) {
      return;
    }

    if (
      configs &&
      configs.google_client_id &&
      configs.google_one_tap_enabled === 'true' &&
      !session &&
      !isPending &&
      !oneTapInitialized.current
    ) {
      oneTapInitialized.current = true;
      showOneTap(configs);
    }
  }, [hasMounted, configs, session, isPending, showOneTap]);

  // set user
  useEffect(() => {
    if (!hasMounted) {
      return;
    }

    const sessionUser = session?.user;
    const currentUserId = authUser?.id;
    const sessionUserId = sessionUser?.id;

    if (sessionUser && sessionUserId !== currentUserId) {
      setUser(sessionUser as UserType);
      fetchUserInfo();
    } else if (!sessionUser && currentUserId) {
      setUser(null);
    }
  }, [hasMounted, session?.user?.id, authUser?.id, setUser, fetchUserInfo]);

  // If not mounted, render placeholder to avoid hydration mismatch
  if (!hasMounted) {
    return (
      <div className="flex h-full items-center justify-center px-4 py-4">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (authUser) {
    return (
      <SidebarMenu className="gap-4 px-3">
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={authUser.image || ''} alt={authUser.name} />
                  <AvatarFallback className="rounded-lg">
                    {authUser.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {authUser.name}
                  </span>
                  {user.show_email && (
                    <span className="truncate text-xs">{authUser.email}</span>
                  )}
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="bg-background w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? 'bottom' : 'right'}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={authUser.image || ''}
                      alt={authUser.name}
                    />
                    <AvatarFallback className="rounded-lg">
                      {authUser.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {authUser.name}
                    </span>
                    {user.show_email && (
                      <span className="truncate text-xs">{authUser.email}</span>
                    )}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {user.nav?.items.map((item: NavItem | undefined) => (
                  <Fragment key={item?.title || item?.url}>
                    <DropdownMenuItem className="cursor-pointer">
                      <Link
                        href={item?.url || ''}
                        target={item?.target}
                        className="flex w-full items-center gap-2"
                      >
                        {item?.icon && <SmartIcon name={item.icon as string} />}
                        {item?.title || ''}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </Fragment>
                ))}
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={handleSignOut}
                >
                  <LogOut />
                  {t('sign_out_title')}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // When user is not logged in
  return (
    <>
      {open ? (
        <div className="flex h-full items-center justify-center px-4 py-4">
          {isCheckSign ? (
            <div className="flex w-full items-center justify-center">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <Button className="w-full" onClick={() => setIsShowSignModal(true)}>
              <User className="mr-1 h-4 w-4" />
              {t('sign_in_title')}
            </Button>
          )}
        </div>
      ) : (
        <SidebarMenu />
      )}

      <SignModal callbackUrl={user.signin_callback || '/'} />
    </>
  );
}
