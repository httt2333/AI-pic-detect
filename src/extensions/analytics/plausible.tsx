import { ReactNode } from 'react';
import Script from 'next/script';

import { AnalyticsConfigs, AnalyticsProvider } from '.';

/**
 * Plausible analytics configs
 * @docs https://plausible.io/docs/integration-guides
 */
export interface PlausibleAnalyticsConfigs extends AnalyticsConfigs {
  domain: string; // data domain
  src: string; // script src
}

/**
 * Plausible provider
 * @website https://plausible.io/
 */
export class PlausibleAnalyticsProvider implements AnalyticsProvider {
  readonly name = 'plausible';

  configs: PlausibleAnalyticsConfigs;

  constructor(configs: PlausibleAnalyticsConfigs) {
    this.configs = configs;
  }

  getHeadScripts(): ReactNode {
    return (
      <>
        {/* Plausible Analytics */}
        <Script
          id={this.name}
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }
            `,
          }}
        />
        <Script
          data-domain={this.configs.domain}
          src={this.configs.src}
          strategy="afterInteractive"
          defer
          async
        />
      </>
    );
  }
}
