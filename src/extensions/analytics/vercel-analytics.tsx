import { ReactNode } from 'react';
import { Analytics } from '@vercel/analytics/next';

import { AnalyticsConfigs, AnalyticsProvider } from '.';

/**
 * Vercel analytics configs
 * @docs https://vercel.com/docs/analytics/quickstart
 */
export interface VercelAnalyticsConfigs extends AnalyticsConfigs {
  mode?: string;
  debug?: boolean;
}

/**
 * Vercel analytics provider
 * @website https://vercel.com/
 */
export class VercelAnalyticsProvider implements AnalyticsProvider {
  readonly name = 'vercel-analytics';

  configs: VercelAnalyticsConfigs;

  constructor(configs: VercelAnalyticsConfigs) {
    this.configs = configs;
  }

  getHeadScripts(): ReactNode {
    return null;
  }

  getBodyScripts(): ReactNode {
    return <Analytics />;
  }

  getMetaTags(): ReactNode {
    return null;
  }
}
