import { redirect } from 'next/navigation';

import { envConfigs } from '@/config';
import { Empty } from '@/shared/blocks/common';
import {
  findSubscriptionBySubscriptionNo,
  updateSubscriptionBySubscriptionNo,
} from '@/shared/models/subscription';
import { getUserInfo } from '@/shared/models/user';
import { getPaymentService } from '@/shared/services/payment';

export default async function RetrieveBillingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ subscription_no: string }>;
}) {
  const { locale } = await params;
  const { subscription_no } = await searchParams;

  if (!subscription_no) {
    return <Empty message="invalid subscription no" />;
  }

  const user = await getUserInfo();
  if (!user) {
    return <Empty message="no auth, please sign in" />;
  }

  const subscription = await findSubscriptionBySubscriptionNo(subscription_no);
  if (!subscription) {
    return <Empty message="subscription not found" />;
  }

  if (!subscription.paymentProvider || !subscription.paymentUserId) {
    return <Empty message="subscription with no payment user id" />;
  }

  if (subscription.userId !== user.id) {
    return <Empty message="no permission" />;
  }

  const paymentService = await getPaymentService();
  const paymentProvider = paymentService.getProvider(
    subscription.paymentProvider
  );
  if (!paymentProvider) {
    return <Empty message="payment provider not found" />;
  }

  let billingUrl = '';

  try {
    const billing = await paymentProvider.getPaymentBilling?.({
      customerId: subscription.paymentUserId,
      returnUrl: `${envConfigs.app_url}/settings/billing`,
    });
    if (!billing?.billingUrl) {
      return <Empty message="billing url not found" />;
    }

    billingUrl = billing.billingUrl;

    await updateSubscriptionBySubscriptionNo(subscription.subscriptionNo, {
      billingUrl: billing.billingUrl,
    });
  } catch (error: any) {
    return <Empty message={error.message || 'get billing failed'} />;
  }

  if (!billingUrl) {
    return <Empty message="billing url not found" />;
  }

  redirect(billingUrl);
}
