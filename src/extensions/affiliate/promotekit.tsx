import { ReactNode } from 'react';
import Script from 'next/script';

import { AffiliateConfigs, AffiliateProvider } from '.';

/**
 * PromoteKit affiliate configs
 * @docs https://docs.promotekit.com/
 */
export interface PromoteKitAffiliateConfigs extends AffiliateConfigs {
  promotekitId: string; // promotekit id
}

/**
 * PromoteKit affiliate provider
 * @website https://promotekit.com/
 */
export class PromoteKitAffiliateProvider implements AffiliateProvider {
  readonly name = 'promotekit';

  configs: PromoteKitAffiliateConfigs;

  constructor(configs: PromoteKitAffiliateConfigs) {
    this.configs = configs;
  }

  getHeadScripts(): ReactNode {
    return (
      <>
        <Script
          id={`${this.name}-script`}
          async
          defer
          src="https://cdn.promotekit.com/promotekit.js"
          data-promotekit={this.configs.promotekitId}
          strategy="afterInteractive"
        />
      </>
    );
  }
}
