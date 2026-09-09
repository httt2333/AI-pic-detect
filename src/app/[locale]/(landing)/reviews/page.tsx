import { ReviewHistory } from '@/features/ai-pic-detect/review-history';

import { getSignUser } from '@/shared/models/user';

export default async function ReviewsPage() {
  const user = await getSignUser();

  return <ReviewHistory isAuthenticated={Boolean(user)} />;
}
