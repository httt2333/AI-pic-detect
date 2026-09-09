import { ReviewExperience } from '@/features/ai-pic-detect/review-experience';
import { setRequestLocale } from 'next-intl/server';

export const revalidate = 3600;

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ReviewExperience />;
}
