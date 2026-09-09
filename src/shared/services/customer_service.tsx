import {
  CrispCustomerServiceProvider,
  CustomerServiceManager,
  TawkCustomerServiceProvider,
} from '@/extensions/customer-service';
import { Configs, getAllConfigs } from '@/shared/models/config';

/**
 * get affiliate manager with configs
 */
export function getCustomerServiceWithConfigs(configs: Configs) {
  const customerServiceManager: CustomerServiceManager =
    new CustomerServiceManager();

  // crisp
  if (configs.crisp_enabled === 'true' && configs.crisp_website_id) {
    customerServiceManager.addProvider(
      new CrispCustomerServiceProvider({
        websiteId: configs.crisp_website_id,
      })
    );
  }

  // tawk
  if (
    configs.tawk_enabled === 'true' &&
    configs.tawk_property_id &&
    configs.tawk_widget_id
  ) {
    customerServiceManager.addProvider(
      new TawkCustomerServiceProvider({
        propertyId: configs.tawk_property_id,
        widgetId: configs.tawk_widget_id,
      })
    );
  }

  return customerServiceManager;
}

/**
 * global customer service
 */
let customerServiceManager: CustomerServiceManager | null = null;

/**
 * get customer service instance
 */
export async function getCustomerService(
  configs?: Configs
): Promise<CustomerServiceManager> {
  if (!configs) {
    configs = await getAllConfigs();
  }
  customerServiceManager = getCustomerServiceWithConfigs(configs);

  return customerServiceManager;
}
