import { ReactNode } from 'react';

import { AdsConfigs, AdsProvider } from '@/extensions/ads';

/**
 * Google adsense configs
 */
export interface AdsenseConfigs extends AdsConfigs {
  adId: string;
}

/**
 * Google adsense provider
 * @website https://adsense.google.com/
 */
export class AdsenseProvider implements AdsProvider {
  readonly name = 'adsense';

  configs: AdsenseConfigs;

  constructor(configs: AdsenseConfigs) {
    this.configs = configs;
  }

  getHeadScripts(): ReactNode {
    return (
      <script
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${this.configs.adId}`}
        crossOrigin="anonymous"
      ></script>
    );
  }

  getBodyScripts(): ReactNode {
    return null;
  }

  getMetaTags(): ReactNode {
    return (
      <meta
        key={this.name}
        name="google-adsense-account"
        content={this.configs.adId}
      />
    );
  }
}
