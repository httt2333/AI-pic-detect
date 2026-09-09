import { ReactNode } from 'react';
import Script from 'next/script';

import { CustomerServiceConfigs, CustomerServiceProvider } from '.';

/**
 * Tawk customer service configs
 * @docs https://developer.tawk.to/jsapi/
 */
export interface TawkCustomerServiceConfigs extends CustomerServiceConfigs {
  propertyId: string; // property id
  widgetId: string; // widget id
}

/**
 * Tawk customer service provider
 * @website https://www.tawk.to/
 */
export class TawkCustomerServiceProvider implements CustomerServiceProvider {
  readonly name = 'tawk';

  configs: TawkCustomerServiceConfigs;

  constructor(configs: TawkCustomerServiceConfigs) {
    this.configs = configs;
  }

  getHeadScripts(): ReactNode {
    return (
      <>
        <Script
          id={`${this.name}-script`}
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
                var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
                (function(){
                var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
                s1.async=true;
                s1.src='https://embed.tawk.to/${this.configs.propertyId}/${this.configs.widgetId}';
                s1.charset='UTF-8';
                s1.setAttribute('crossorigin','*');
                s0.parentNode.insertBefore(s1,s0);
                })();
            `,
          }}
        />
      </>
    );
  }
}
