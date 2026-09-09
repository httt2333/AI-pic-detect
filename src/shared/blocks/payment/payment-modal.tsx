'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/shared/components/ui/drawer';
import { useAppContext } from '@/shared/contexts/app';
import { useMediaQuery } from '@/shared/hooks/use-media-query';
import { PricingItem } from '@/shared/types/blocks/pricing';

import { PaymentProviders } from './payment-providers';

export function PaymentModal({
  isLoading,
  pricingItem,
  onCheckout,
}: {
  isLoading: boolean;
  pricingItem: PricingItem | null;
  onCheckout: (item: PricingItem, paymentProvider?: string) => void;
}) {
  const t = useTranslations('common.payment');
  const { isShowPaymentModal, setIsShowPaymentModal } = useAppContext();
  const { configs } = useAppContext();

  // todo: dynamic set callbackURL
  const callbackURL = '/';

  const isDesktop = useMediaQuery('(min-width: 768px)');

  if (isDesktop) {
    return (
      <Dialog open={isShowPaymentModal} onOpenChange={setIsShowPaymentModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('choose_payment_method')}</DialogTitle>
            <DialogDescription>
              {t('choose_payment_method_description')}
            </DialogDescription>
          </DialogHeader>
          <PaymentProviders
            callbackUrl={callbackURL}
            configs={configs}
            loading={isLoading}
            setLoading={() => {}}
            pricingItem={pricingItem}
            onCheckout={onCheckout}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isShowPaymentModal} onOpenChange={setIsShowPaymentModal}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{t('choose_payment_method')}</DrawerTitle>
          <DrawerDescription>
            {t('choose_payment_method_description')}
          </DrawerDescription>
        </DrawerHeader>
        <PaymentProviders
          callbackUrl={callbackURL}
          configs={configs}
          loading={isLoading}
          setLoading={() => {}}
          pricingItem={pricingItem}
          onCheckout={onCheckout}
          className="px-4"
        />
        <DrawerFooter className="pt-4">
          <DrawerClose asChild>
            <Button variant="outline">{t('cancel_title')}</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
