import { redirect } from 'next/navigation';

import { Empty } from '@/shared/blocks/common';
import {
  findOrderByOrderNo,
  Order,
  updateOrderByOrderNo,
} from '@/shared/models/order';
import { getUserInfo } from '@/shared/models/user';
import { getPaymentService } from '@/shared/services/payment';

export default async function RetrieveInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ order_no: string }>;
}) {
  const { locale } = await params;
  const { order_no } = await searchParams;

  if (!order_no) {
    return <Empty message="invalid order no" />;
  }

  const user = await getUserInfo();
  if (!user) {
    return <Empty message="no auth, please sign in" />;
  }

  const order = await findOrderByOrderNo(order_no);
  if (!order) {
    return <Empty message="order not found" />;
  }

  if (!order.paymentProvider || !order.invoiceId) {
    return <Empty message="order with no invoice" />;
  }

  if (order.userId !== user.id) {
    return <Empty message="no permission" />;
  }

  const paymentService = await getPaymentService();
  const paymentProvider = paymentService.getProvider(order.paymentProvider);
  if (!paymentProvider) {
    return <Empty message="payment provider not found" />;
  }

  let invoiceUrl = '';

  try {
    const invoice = await paymentProvider.getPaymentInvoice?.({
      invoiceId: order.invoiceId,
    });
    if (!invoice?.invoiceUrl) {
      return <Empty message="invoice url not found" />;
    }

    invoiceUrl = invoice.invoiceUrl;

    await updateOrderByOrderNo(order.orderNo, {
      invoiceUrl: invoiceUrl,
    });
  } catch (error: any) {
    return <Empty message={error.message || 'get invoice failed'} />;
  }

  if (!invoiceUrl) {
    return <Empty message="invoice url not found" />;
  }

  redirect(invoiceUrl);
}
