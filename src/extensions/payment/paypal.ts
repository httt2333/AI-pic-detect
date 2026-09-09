import {
  CheckoutSession,
  PaymentBilling,
  PaymentEventType,
  PaymentInterval,
  PaymentInvoice,
  PaymentStatus,
  PaymentType,
  SubscriptionCycleType,
  SubscriptionInfo,
  SubscriptionStatus,
  type PaymentConfigs,
  type PaymentEvent,
  type PaymentOrder,
  type PaymentProvider,
  type PaymentSession,
} from './types';

/**
 * PayPal payment provider configs
 * @docs https://developer.paypal.com/docs/
 */
export interface PayPalConfigs extends PaymentConfigs {
  clientId: string;
  clientSecret: string;
  webhookId?: string;
  environment?: 'sandbox' | 'production';
}

/**
 * PayPal payment provider implementation
 * @website https://www.paypal.com/
 */
export class PayPalProvider implements PaymentProvider {
  readonly name = 'paypal';
  configs: PayPalConfigs;

  private baseUrl: string;
  private accessToken?: string;
  private tokenExpiry?: number;

  constructor(configs: PayPalConfigs) {
    this.configs = configs;
    this.baseUrl =
      configs.environment === 'production'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';
  }

  /**
   * Create payment (one-time or subscription)
   */
  async createPayment({
    order,
  }: {
    order: PaymentOrder;
  }): Promise<CheckoutSession> {
    try {
      await this.ensureAccessToken();

      // check payment price
      if (!order.price) {
        throw new Error('price is required');
      }

      if (order.type === PaymentType.SUBSCRIPTION) {
        // create subscription payment
        return await this.createSubscriptionPayment(order);
      } else {
        // create one-time payment
        return await this.createOneTimePayment(order);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create one-time payment
   */
  private async createOneTimePayment(
    order: PaymentOrder
  ): Promise<CheckoutSession> {
    const items = [
      {
        name: order.description || 'Payment',
        unit_amount: {
          currency_code: order.price!.currency.toUpperCase(),
          value: (order.price!.amount / 100).toFixed(2), // convert cents to dollars
        },
        quantity: '1',
      },
    ];

    const totalAmount = items.reduce(
      (sum, item) => sum + parseFloat(item.unit_amount.value),
      0
    );

    const payload: any = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: order.orderNo,
          custom_id: order.metadata
            ? JSON.stringify(order.metadata)
            : undefined,
          items,
          amount: {
            currency_code: order.price!.currency.toUpperCase(),
            value: totalAmount.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: order.price!.currency.toUpperCase(),
                value: totalAmount.toFixed(2),
              },
            },
          },
        },
      ],
      application_context: {
        return_url: order.successUrl,
        cancel_url: order.cancelUrl,
        user_action: 'PAY_NOW',
        brand_name: order.description,
      },
    };

    // set payer info if customer provided
    if (order.customer?.email) {
      payload.payer = {
        email_address: order.customer.email,
        name: order.customer.name
          ? {
              given_name: order.customer.name.split(' ')[0],
              surname: order.customer.name.split(' ').slice(1).join(' ') || '',
            }
          : undefined,
      };
    }

    const result = await this.makeRequest(
      '/v2/checkout/orders',
      'POST',
      payload
    );

    const approvalUrl = result.links?.find(
      (link: any) => link.rel === 'approve'
    )?.href;

    return {
      provider: this.name,
      checkoutParams: payload,
      checkoutInfo: {
        sessionId: result.id,
        checkoutUrl: approvalUrl,
      },
      checkoutResult: result,
      metadata: order.metadata || {},
    };
  }

  /**
   * Create subscription payment
   */
  private async createSubscriptionPayment(
    order: PaymentOrder
  ): Promise<CheckoutSession> {
    if (!order.plan) {
      throw new Error('plan is required for subscription');
    }

    // First create a product
    const productPayload = {
      name: order.plan.name,
      description: order.plan.description || order.description,
      type: 'SERVICE',
      category: 'SOFTWARE',
    };

    const productResponse = await this.makeRequest(
      '/v1/catalogs/products',
      'POST',
      productPayload
    );

    // Create a billing plan
    const planPayload: any = {
      product_id: productResponse.id,
      name: order.plan.name,
      description: order.plan.description || order.description,
      billing_cycles: [
        {
          frequency: {
            interval_unit: this.mapIntervalToPayPal(order.plan.interval),
            interval_count: order.plan.intervalCount || 1,
          },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0, // Infinite
          pricing_scheme: {
            fixed_price: {
              value: (order.price!.amount / 100).toFixed(2),
              currency_code: order.price!.currency.toUpperCase(),
            },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 3,
      },
    };

    // Add trial period if specified
    if (order.plan.trialPeriodDays && order.plan.trialPeriodDays > 0) {
      planPayload.billing_cycles.unshift({
        frequency: {
          interval_unit: 'DAY',
          interval_count: 1,
        },
        tenure_type: 'TRIAL',
        sequence: 0,
        total_cycles: order.plan.trialPeriodDays,
        pricing_scheme: {
          fixed_price: {
            value: '0.00',
            currency_code: order.price!.currency.toUpperCase(),
          },
        },
      });
      // Update sequence numbers
      planPayload.billing_cycles[1].sequence = 1;
    }

    const planResponse = await this.makeRequest(
      '/v1/billing/plans',
      'POST',
      planPayload
    );

    // Create subscription
    const subscriptionPayload: any = {
      plan_id: planResponse.id,
      custom_id: order.metadata ? JSON.stringify(order.metadata) : undefined,
      application_context: {
        brand_name: order.description || 'Subscription',
        locale: 'en-US',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        payment_method: {
          payer_selected: 'PAYPAL',
          payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
        },
        return_url: order.successUrl,
        cancel_url: order.cancelUrl,
      },
    };

    // set subscriber info if customer provided
    if (order.customer?.email) {
      subscriptionPayload.subscriber = {
        email_address: order.customer.email,
        name: order.customer.name
          ? {
              given_name: order.customer.name.split(' ')[0],
              surname: order.customer.name.split(' ').slice(1).join(' ') || '',
            }
          : undefined,
      };
    }

    const subscriptionResponse = await this.makeRequest(
      '/v1/billing/subscriptions',
      'POST',
      subscriptionPayload
    );

    const approvalUrl = subscriptionResponse.links?.find(
      (link: any) => link.rel === 'approve'
    )?.href;

    return {
      provider: this.name,
      checkoutParams: subscriptionPayload,
      checkoutInfo: {
        sessionId: subscriptionResponse.id,
        checkoutUrl: approvalUrl,
      },
      checkoutResult: subscriptionResponse,
      metadata: order.metadata || {},
    };
  }

  /**
   * Get payment session by session id
   */
  async getPaymentSession({
    sessionId,
  }: {
    sessionId: string;
  }): Promise<PaymentSession> {
    try {
      if (!sessionId) {
        throw new Error('sessionId is required');
      }

      await this.ensureAccessToken();

      // Try to get as order first
      try {
        let orderResult = await this.makeRequest(
          `/v2/checkout/orders/${sessionId}`,
          'GET'
        );

        // If order status is APPROVED, auto-capture the payment
        // APPROVED means user has authorized but payment not yet captured
        if (orderResult.status === 'APPROVED') {
          console.log(
            'PayPal order is APPROVED, auto-capturing payment...',
            sessionId
          );
          orderResult = await this.makeRequest(
            `/v2/checkout/orders/${sessionId}/capture`,
            'POST'
          );
          console.log(
            'PayPal payment captured, new status:',
            orderResult.status
          );
        }

        return await this.buildPaymentSessionFromOrder(orderResult);
      } catch (orderError: any) {
        // If not found as order, try as subscription
        if (
          orderError.message?.includes('RESOURCE_NOT_FOUND') ||
          orderError.message?.includes('INVALID_RESOURCE_ID')
        ) {
          let subscriptionResult = await this.makeRequest(
            `/v1/billing/subscriptions/${sessionId}`,
            'GET'
          );

          // If subscription status is APPROVED, wait for it to become ACTIVE
          // PayPal automatically activates subscription after user approval
          if (subscriptionResult.status === 'APPROVED') {
            console.log(
              'PayPal subscription is APPROVED, waiting for activation...',
              sessionId
            );

            // Poll for up to 10 seconds (5 attempts, 2 seconds apart)
            for (let i = 0; i < 5; i++) {
              await new Promise((resolve) => setTimeout(resolve, 2000));
              subscriptionResult = await this.makeRequest(
                `/v1/billing/subscriptions/${sessionId}`,
                'GET'
              );
              console.log(
                `PayPal subscription poll ${i + 1}/5, status:`,
                subscriptionResult.status
              );

              if (subscriptionResult.status === 'ACTIVE') {
                console.log('PayPal subscription activated successfully');
                break;
              }
            }

            // If still APPROVED after polling, treat it as success
            // PayPal will activate it shortly
            if (subscriptionResult.status === 'APPROVED') {
              console.log(
                'PayPal subscription still APPROVED after polling, treating as success'
              );
            }
          }

          return await this.buildPaymentSessionFromSubscription(
            subscriptionResult
          );
        }
        throw orderError;
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get payment event from webhook notification
   */
  async getPaymentEvent({ req }: { req: Request }): Promise<PaymentEvent> {
    try {
      const rawBody = await req.text();

      if (!this.configs.webhookId) {
        throw new Error('webhookId not configured');
      }

      const event = JSON.parse(rawBody);
      if (!event || !event.event_type) {
        throw new Error('Invalid webhook payload');
      }

      // verify webhook with PayPal
      await this.ensureAccessToken();

      // Get headers (handle case-insensitivity)
      const getHeader = (name: string): string => {
        return (
          req.headers.get(name) ||
          req.headers.get(name.toLowerCase()) ||
          req.headers.get(name.toUpperCase()) ||
          ''
        );
      };

      // Check if signature headers are present (real events have these, simulated events may not)
      const authAlgo = getHeader('paypal-auth-algo');
      const certUrl = getHeader('paypal-cert-url');
      const transmissionId = getHeader('paypal-transmission-id');
      const transmissionSig = getHeader('paypal-transmission-sig');
      const transmissionTime = getHeader('paypal-transmission-time');

      const hasSignatureHeaders = !!(
        authAlgo &&
        transmissionId &&
        transmissionSig &&
        transmissionTime
      );

      // If signature headers are present, verify the signature
      if (hasSignatureHeaders) {
        const verifyPayload = {
          auth_algo: authAlgo,
          cert_url: certUrl,
          transmission_id: transmissionId,
          transmission_sig: transmissionSig,
          transmission_time: transmissionTime,
          webhook_id: this.configs.webhookId,
          webhook_event: event,
        };

        const verifyResponse = await this.makeRequest(
          '/v1/notifications/verify-webhook-signature',
          'POST',
          verifyPayload
        );

        if (verifyResponse.verification_status !== 'SUCCESS') {
          // In production, always reject invalid signatures
          if (this.configs.environment === 'production') {
            throw new Error(
              `Invalid webhook signature: ${verifyResponse.verification_status}`
            );
          }

          // In sandbox, log warning but continue processing
          // PayPal sandbox signature verification is known to be unreliable
          console.warn(
            `PayPal webhook signature verification failed in sandbox: ${verifyResponse.verification_status}. ` +
              'Continuing anyway as this is a known issue with PayPal sandbox.'
          );
        }
      } else {
        // No signature headers - this is a simulated/test event from PayPal Dashboard
        if (this.configs.environment === 'production') {
          // In production, reject events without signature headers
          throw new Error(
            'Missing webhook signature headers - rejecting event'
          );
        }

        // In sandbox, allow events without headers (simulated events from Dashboard)
        console.warn(
          'PayPal webhook: No signature headers present (simulated event). Skipping verification in sandbox.'
        );
      }

      // console.log('paypal webhook event', JSON.stringify(event, null, 2));

      // Map PayPal event type to internal event type
      const eventType = this.mapPayPalEventType(event.event_type);
      let paymentSession: PaymentSession | undefined = undefined;

      // Build payment session based on event type
      if (eventType === PaymentEventType.CHECKOUT_SUCCESS) {
        // Order completed/approved
        paymentSession = await this.buildPaymentSessionFromOrder(
          event.resource
        );
      } else if (eventType === PaymentEventType.PAYMENT_SUCCESS) {
        // Payment captured or subscription payment
        if (
          event.resource.billing_agreement_id ||
          event.resource.subscription_id
        ) {
          // Subscription payment
          const subscriptionId =
            event.resource.billing_agreement_id ||
            event.resource.subscription_id;
          const subscription = await this.makeRequest(
            `/v1/billing/subscriptions/${subscriptionId}`,
            'GET'
          );
          paymentSession = await this.buildPaymentSessionFromSubscription(
            subscription,
            event.resource
          );
        } else {
          // One-time payment
          paymentSession = await this.buildPaymentSessionFromCapture(
            event.resource
          );
        }
      } else if (
        eventType === PaymentEventType.SUBSCRIBE_UPDATED ||
        eventType === PaymentEventType.SUBSCRIBE_CANCELED
      ) {
        paymentSession = await this.buildPaymentSessionFromSubscription(
          event.resource
        );
      } else if (eventType === PaymentEventType.PAYMENT_FAILED) {
        paymentSession = {
          provider: this.name,
          paymentStatus: PaymentStatus.FAILED,
          paymentResult: event.resource,
        };
      }

      return {
        eventType: eventType,
        eventResult: event,
        paymentSession: paymentSession,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get payment invoice
   * Note: PayPal doesn't have a direct public invoice URL like Stripe.
   * The invoiceId we store is actually a capture_id or sale_id.
   * We return a link to PayPal's activity page where users can log in and view their transactions.
   */
  async getPaymentInvoice({
    invoiceId,
  }: {
    invoiceId: string;
  }): Promise<PaymentInvoice> {
    try {
      await this.ensureAccessToken();

      // PayPal activity page URL (users need to log in to view their transactions)
      const activityUrl =
        this.configs.environment === 'production'
          ? 'https://www.paypal.com/myaccount/transactions'
          : 'https://www.sandbox.paypal.com/myaccount/transactions';

      // Try to get capture details for amount info (for one-time payments)
      try {
        const capture = await this.makeRequest(
          `/v2/payments/captures/${invoiceId}`,
          'GET'
        );

        return {
          invoiceId: capture.id,
          invoiceUrl: activityUrl,
          amount: capture.amount?.value
            ? parseFloat(capture.amount.value) * 100
            : undefined,
          currency: capture.amount?.currency_code,
        };
      } catch (captureError: any) {
        // If not a capture (subscription sale), just return the activity URL
        return {
          invoiceId: invoiceId,
          invoiceUrl: activityUrl,
        };
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get payment billing (subscription management URL)
   */
  async getPaymentBilling({
    customerId: _customerId,
    returnUrl: _returnUrl,
  }: {
    customerId: string;
    returnUrl?: string;
  }): Promise<PaymentBilling> {
    try {
      // PayPal doesn't have a direct billing portal like Stripe
      // We return the PayPal subscription management URL
      // Note: customerId and returnUrl are not used in PayPal's implementation
      const billingUrl =
        this.configs.environment === 'production'
          ? `https://www.paypal.com/myaccount/autopay`
          : `https://www.sandbox.paypal.com/myaccount/autopay`;

      return {
        billingUrl: billingUrl,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription({
    subscriptionId,
  }: {
    subscriptionId: string;
  }): Promise<PaymentSession> {
    try {
      if (!subscriptionId) {
        throw new Error('subscriptionId is required');
      }

      await this.ensureAccessToken();

      // Cancel the subscription
      await this.makeRequest(
        `/v1/billing/subscriptions/${subscriptionId}/cancel`,
        'POST',
        {
          reason: 'Customer requested cancellation',
        }
      );

      // Get updated subscription details
      const subscription = await this.makeRequest(
        `/v1/billing/subscriptions/${subscriptionId}`,
        'GET'
      );

      return await this.buildPaymentSessionFromSubscription(subscription);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Capture an authorized payment
   */
  async capturePayment(orderId: string): Promise<PaymentSession> {
    try {
      await this.ensureAccessToken();

      const result = await this.makeRequest(
        `/v2/checkout/orders/${orderId}/capture`,
        'POST'
      );

      return await this.buildPaymentSessionFromOrder(result);
    } catch (error) {
      throw error;
    }
  }

  // ============ Private Helper Methods ============

  private async ensureAccessToken() {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return;
    }

    const credentials = Buffer.from(
      `${this.configs.clientId}:${this.configs.clientSecret}`
    ).toString('base64');

    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(
        `PayPal authentication failed: ${data.error_description}`
      );
    }

    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + data.expires_in * 1000;
  }

  private async makeRequest(endpoint: string, method: string, data?: any) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      method,
      headers,
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(url, config);

    // Handle empty response (204 No Content)
    if (response.status === 204) {
      return {};
    }

    if (!response.ok) {
      const result = await response.json();
      let errorMessage = result.name || result.error || 'Unknown error';
      if (result.details) {
        errorMessage += `: ${result.details
          .map((detail: any) => detail.issue || detail.description)
          .join(', ')}`;
      }
      if (result.message) {
        errorMessage += `: ${result.message}`;
      }
      throw new Error(`PayPal request failed: ${errorMessage}`);
    }

    return await response.json();
  }

  private mapPayPalEventType(eventType: string): PaymentEventType {
    switch (eventType) {
      // Order events
      case 'CHECKOUT.ORDER.APPROVED':
      case 'CHECKOUT.ORDER.COMPLETED':
        return PaymentEventType.CHECKOUT_SUCCESS;

      // Payment capture events
      case 'PAYMENT.CAPTURE.COMPLETED':
      case 'PAYMENT.SALE.COMPLETED':
        return PaymentEventType.PAYMENT_SUCCESS;

      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.DECLINED':
      case 'PAYMENT.SALE.DENIED':
        return PaymentEventType.PAYMENT_FAILED;

      case 'PAYMENT.CAPTURE.REFUNDED':
      case 'PAYMENT.SALE.REFUNDED':
        return PaymentEventType.PAYMENT_REFUNDED;

      // Subscription events
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
      case 'BILLING.SUBSCRIPTION.UPDATED':
      case 'BILLING.SUBSCRIPTION.RE-ACTIVATED':
        return PaymentEventType.SUBSCRIBE_UPDATED;

      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
      case 'BILLING.SUBSCRIPTION.EXPIRED':
        return PaymentEventType.SUBSCRIBE_CANCELED;

      // Subscription payment events
      case 'PAYMENT.SALE.COMPLETED':
        return PaymentEventType.PAYMENT_SUCCESS;

      default:
        throw new Error(`Unknown PayPal event type: ${eventType}`);
    }
  }

  private mapPayPalStatus(status: string): PaymentStatus {
    switch (status) {
      case 'CREATED':
      case 'SAVED':
      case 'PAYER_ACTION_REQUIRED':
        return PaymentStatus.PROCESSING;
      case 'APPROVED':
        // For orders: needs capture (handled in getPaymentSession)
        // For subscriptions: will auto-activate, treat as processing
        return PaymentStatus.PROCESSING;
      case 'COMPLETED':
      case 'CAPTURED':
      case 'ACTIVE':
        return PaymentStatus.SUCCESS;
      case 'VOIDED':
      case 'CANCELLED':
      case 'CANCELED':
      case 'EXPIRED':
        return PaymentStatus.CANCELED;
      case 'DENIED':
      case 'DECLINED':
      case 'FAILED':
      case 'SUSPENDED':
        return PaymentStatus.FAILED;
      default:
        return PaymentStatus.PROCESSING;
    }
  }

  private mapPayPalSubscriptionStatus(status: string): SubscriptionStatus {
    switch (status) {
      case 'ACTIVE':
        return SubscriptionStatus.ACTIVE;
      case 'APPROVAL_PENDING':
      case 'APPROVED':
        return SubscriptionStatus.ACTIVE;
      case 'CANCELLED':
        return SubscriptionStatus.CANCELED;
      case 'SUSPENDED':
        return SubscriptionStatus.PAUSED;
      case 'EXPIRED':
        return SubscriptionStatus.EXPIRED;
      default:
        return SubscriptionStatus.ACTIVE;
    }
  }

  private mapIntervalToPayPal(
    interval: PaymentInterval
  ): 'DAY' | 'WEEK' | 'MONTH' | 'YEAR' {
    switch (interval) {
      case PaymentInterval.DAY:
        return 'DAY';
      case PaymentInterval.WEEK:
        return 'WEEK';
      case PaymentInterval.MONTH:
        return 'MONTH';
      case PaymentInterval.YEAR:
        return 'YEAR';
      default:
        return 'MONTH';
    }
  }

  private mapPayPalIntervalToInternal(interval: string): PaymentInterval {
    switch (interval?.toUpperCase()) {
      case 'DAY':
        return PaymentInterval.DAY;
      case 'WEEK':
        return PaymentInterval.WEEK;
      case 'MONTH':
        return PaymentInterval.MONTH;
      case 'YEAR':
        return PaymentInterval.YEAR;
      default:
        return PaymentInterval.MONTH;
    }
  }

  // Build payment session from order
  private async buildPaymentSessionFromOrder(
    order: any
  ): Promise<PaymentSession> {
    const purchaseUnit = order.purchase_units?.[0];
    const payer = order.payer;
    const capture = purchaseUnit?.payments?.captures?.[0];
    const breakdown = purchaseUnit?.amount?.breakdown;

    // Parse metadata from custom_id
    let metadata: any = {};
    if (purchaseUnit?.custom_id) {
      try {
        metadata = JSON.parse(purchaseUnit.custom_id);
      } catch {
        metadata = { custom_id: purchaseUnit.custom_id };
      }
    }

    // Get discount info from breakdown
    const discountValue = breakdown?.discount?.value
      ? parseFloat(breakdown.discount.value)
      : 0;
    const discountCurrency =
      breakdown?.discount?.currency_code ||
      purchaseUnit?.amount?.currency_code ||
      capture?.amount?.currency_code ||
      '';

    // Get payment amount - prefer capture amount (after capture), fallback to purchase unit amount
    // After capture, the amount is in captures[0].amount, not purchase_units[0].amount
    let paymentValue = 0;
    let paymentCurrency = '';

    if (capture?.amount?.value) {
      // Use capture amount (after capture API is called)
      paymentValue = parseFloat(capture.amount.value);
      paymentCurrency = capture.amount.currency_code || '';
    } else if (purchaseUnit?.amount?.value) {
      // Fallback to purchase unit amount (before capture)
      paymentValue = parseFloat(purchaseUnit.amount.value);
      paymentCurrency = purchaseUnit.amount.currency_code || '';
    }

    const result: PaymentSession = {
      provider: this.name,
      paymentStatus: this.mapPayPalStatus(order.status),
      paymentInfo: {
        transactionId: order.id,
        discountCode: '', // PayPal doesn't have promotion codes like Stripe
        discountAmount: Math.round(discountValue * 100), // Convert to cents
        discountCurrency: discountCurrency || paymentCurrency,
        paymentAmount: Math.round(paymentValue * 100), // Convert to cents
        paymentCurrency: paymentCurrency,
        paymentEmail: payer?.email_address,
        paymentUserName: payer?.name
          ? `${payer.name.given_name || ''} ${payer.name.surname || ''}`.trim()
          : undefined,
        paymentUserId: payer?.payer_id,
        paidAt: capture?.create_time
          ? new Date(capture.create_time)
          : order.create_time
            ? new Date(order.create_time)
            : undefined,
        invoiceId: capture?.id,
      },
      paymentResult: order,
      metadata: metadata,
    };

    return result;
  }

  // Build payment session from capture event
  private async buildPaymentSessionFromCapture(
    capture: any
  ): Promise<PaymentSession> {
    // Get breakdown info from seller_receivable_breakdown
    const breakdown = capture.seller_receivable_breakdown;

    // Get discount from breakdown (if any)
    const discountValue = breakdown?.discount?.value
      ? parseFloat(breakdown.discount.value)
      : 0;
    const discountCurrency =
      breakdown?.discount?.currency_code || capture.amount?.currency_code || '';

    // Get payment amount
    const paymentValue = capture.amount?.value
      ? parseFloat(capture.amount.value)
      : 0;
    const paymentCurrency = capture.amount?.currency_code || '';

    // Parse metadata from custom_id (set during order creation)
    let metadata: any = {};
    if (capture.custom_id) {
      try {
        metadata = JSON.parse(capture.custom_id);
      } catch {
        metadata = { custom_id: capture.custom_id };
      }
    }

    // Try to get order_id from supplementary_data for fetching full order info
    const orderId = capture.supplementary_data?.related_ids?.order_id;
    if (orderId && !metadata.order_no) {
      try {
        const order = await this.makeRequest(
          `/v2/checkout/orders/${orderId}`,
          'GET'
        );
        const purchaseUnit = order.purchase_units?.[0];
        if (purchaseUnit?.custom_id) {
          try {
            metadata = JSON.parse(purchaseUnit.custom_id);
          } catch {
            metadata = { custom_id: purchaseUnit.custom_id };
          }
        }
      } catch (e) {
        console.log('Failed to fetch order for metadata:', e);
      }
    }

    const result: PaymentSession = {
      provider: this.name,
      paymentStatus: this.mapPayPalStatus(capture.status),
      paymentInfo: {
        transactionId: capture.id,
        discountCode: '',
        discountAmount: Math.round(discountValue * 100), // Convert to cents
        discountCurrency: discountCurrency,
        paymentAmount: Math.round(paymentValue * 100), // Convert to cents
        paymentCurrency: paymentCurrency,
        paidAt: capture.create_time ? new Date(capture.create_time) : undefined,
        invoiceId: capture.id,
      },
      paymentResult: capture,
      metadata: metadata,
    };

    return result;
  }

  // Build payment session from subscription
  private async buildPaymentSessionFromSubscription(
    subscription: any,
    saleEvent?: any
  ): Promise<PaymentSession> {
    // Parse metadata from custom_id
    let metadata: any = {};
    if (subscription.custom_id) {
      try {
        metadata = JSON.parse(subscription.custom_id);
      } catch {
        metadata = { custom_id: subscription.custom_id };
      }
    }

    // Get billing info from subscription
    const billingInfo = subscription.billing_info;
    const lastPayment = billingInfo?.last_payment;
    const subscriber = subscription.subscriber;

    // Build base payment info from subscription data (always present)
    // This ensures paymentInfo is always returned, like Stripe does
    let paymentAmount = 0;
    let paymentCurrency = '';
    let discountAmount = 0;
    let discountCurrency = '';
    let paidAt: Date | undefined;
    let transactionId = subscription.id;

    // If we have a sale event, use its data (more accurate for webhook events)
    if (saleEvent) {
      const breakdown = saleEvent.seller_receivable_breakdown;
      discountAmount = breakdown?.discount?.value
        ? Math.round(parseFloat(breakdown.discount.value) * 100)
        : 0;
      discountCurrency =
        breakdown?.discount?.currency_code ||
        saleEvent.amount?.currency_code ||
        '';
      paymentAmount = saleEvent.amount?.value
        ? Math.round(parseFloat(saleEvent.amount.value) * 100)
        : 0;
      paymentCurrency = saleEvent.amount?.currency_code || '';
      paidAt = saleEvent.create_time
        ? new Date(saleEvent.create_time)
        : undefined;
      transactionId = saleEvent.id;
    } else if (lastPayment) {
      // Use last_payment from subscription billing_info
      paymentAmount = lastPayment.amount?.value
        ? Math.round(parseFloat(lastPayment.amount.value) * 100)
        : 0;
      paymentCurrency = lastPayment.amount?.currency_code || '';
      paidAt = lastPayment.time ? new Date(lastPayment.time) : undefined;
    }

    // For subscriptions, APPROVED means user has authorized, treat as SUCCESS
    // PayPal will automatically activate the subscription
    const subscriptionPaymentStatus =
      subscription.status === 'APPROVED' || subscription.status === 'ACTIVE'
        ? PaymentStatus.SUCCESS
        : this.mapPayPalStatus(subscription.status);

    const result: PaymentSession = {
      provider: this.name,
      paymentStatus: subscriptionPaymentStatus,
      paymentInfo: {
        transactionId: transactionId,
        discountCode: '',
        discountAmount: discountAmount,
        discountCurrency: discountCurrency || paymentCurrency,
        paymentAmount: paymentAmount,
        paymentCurrency: paymentCurrency,
        paymentEmail: subscriber?.email_address,
        paymentUserName: subscriber?.name
          ? `${subscriber.name.given_name || ''} ${subscriber.name.surname || ''}`.trim()
          : undefined,
        paymentUserId: subscriber?.payer_id,
        paidAt: paidAt,
        invoiceId: saleEvent?.id || lastPayment?.id,
        subscriptionCycleType: saleEvent
          ? billingInfo?.cycle_executions?.[0]?.cycles_completed === 1
            ? SubscriptionCycleType.CREATE
            : SubscriptionCycleType.RENEWAL
          : undefined,
      },
      paymentResult: saleEvent || subscription,
      subscriptionId: subscription.id,
      subscriptionInfo: await this.buildSubscriptionInfo(subscription),
      subscriptionResult: subscription,
      metadata: metadata,
    };

    return result;
  }

  // Build subscription info from subscription
  private async buildSubscriptionInfo(
    subscription: any
  ): Promise<SubscriptionInfo> {
    const billingInfo = subscription.billing_info;

    // Get plan details if available
    let planDetails: any = null;
    if (subscription.plan_id) {
      try {
        planDetails = await this.makeRequest(
          `/v1/billing/plans/${subscription.plan_id}`,
          'GET'
        );
      } catch {
        // Plan details not available, continue without it
      }
    }

    const billingCycle = planDetails?.billing_cycles?.find(
      (cycle: any) => cycle.tenure_type === 'REGULAR'
    );

    // Determine interval for period calculation
    const interval = billingCycle?.frequency?.interval_unit
      ? this.mapPayPalIntervalToInternal(billingCycle.frequency.interval_unit)
      : PaymentInterval.MONTH;
    const intervalCount = billingCycle?.frequency?.interval_count || 1;

    // Calculate currentPeriodStart
    const currentPeriodStart = billingInfo?.last_payment?.time
      ? new Date(billingInfo.last_payment.time)
      : new Date(subscription.start_time || subscription.create_time);

    // Calculate currentPeriodEnd
    // Prefer PayPal's next_billing_time, fallback to calculated value based on interval
    let currentPeriodEnd: Date;
    if (billingInfo?.next_billing_time) {
      currentPeriodEnd = new Date(billingInfo.next_billing_time);
    } else {
      // Calculate based on interval from currentPeriodStart
      currentPeriodEnd = new Date(currentPeriodStart);
      switch (interval) {
        case PaymentInterval.DAY:
          currentPeriodEnd.setDate(currentPeriodEnd.getDate() + intervalCount);
          break;
        case PaymentInterval.WEEK:
          currentPeriodEnd.setDate(
            currentPeriodEnd.getDate() + intervalCount * 7
          );
          break;
        case PaymentInterval.MONTH:
          currentPeriodEnd.setMonth(
            currentPeriodEnd.getMonth() + intervalCount
          );
          break;
        case PaymentInterval.YEAR:
          currentPeriodEnd.setFullYear(
            currentPeriodEnd.getFullYear() + intervalCount
          );
          break;
        default:
          currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
      }
    }

    const subscriptionInfo: SubscriptionInfo = {
      subscriptionId: subscription.id,
      productId: planDetails?.product_id,
      planId: subscription.plan_id,
      description: planDetails?.name || subscription.plan_id,
      amount: billingCycle?.pricing_scheme?.fixed_price?.value
        ? parseFloat(billingCycle.pricing_scheme.fixed_price.value) * 100
        : billingInfo?.last_payment?.amount?.value
          ? parseFloat(billingInfo.last_payment.amount.value) * 100
          : 0,
      currency:
        billingCycle?.pricing_scheme?.fixed_price?.currency_code ||
        billingInfo?.last_payment?.amount?.currency_code ||
        'USD',
      interval: interval,
      intervalCount: intervalCount,
      currentPeriodStart: currentPeriodStart,
      currentPeriodEnd: currentPeriodEnd,
      metadata: subscription.custom_id
        ? (() => {
            try {
              return JSON.parse(subscription.custom_id);
            } catch {
              return { custom_id: subscription.custom_id };
            }
          })()
        : {},
      status: this.mapPayPalSubscriptionStatus(subscription.status),
    };

    // Handle cancellation info
    if (
      subscription.status === 'CANCELLED' ||
      subscription.status === 'SUSPENDED'
    ) {
      subscriptionInfo.canceledAt = subscription.status_update_time
        ? new Date(subscription.status_update_time)
        : undefined;
      subscriptionInfo.canceledReason = subscription.status_change_note || '';
    }

    return subscriptionInfo;
  }
}

/**
 * Create PayPal provider with configs
 */
export function createPayPalProvider(configs: PayPalConfigs): PayPalProvider {
  return new PayPalProvider(configs);
}
