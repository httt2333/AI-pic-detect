export function shouldLoadAccountPricingState(
  purchaseEnabled: boolean | undefined
): boolean {
  return purchaseEnabled === true;
}
