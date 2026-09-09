import { ReactNode } from 'react';

import { LocaleDetector } from '@/shared/blocks/common';

export default async function LandingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <LocaleDetector />
      {children}
    </>
  );
}
