import { Fragment, ReactNode } from 'react';

/**
 * Analytics configs interface
 */
export interface AnalyticsConfigs {
  [key: string]: any;
}

/**
 * Analytics provider interface
 */
export interface AnalyticsProvider {
  // provider name
  readonly name: string;

  // provider configs
  configs?: AnalyticsConfigs;

  // meta tags inject to head
  getMetaTags?: () => ReactNode;

  // scripts inject to head
  getHeadScripts?: () => ReactNode;

  // scripts inject to body
  getBodyScripts?: () => ReactNode;
}

/**
 * Analytics manager to manage all analytics providers
 */
export class AnalyticsManager {
  // analytics providers
  private providers: AnalyticsProvider[] = [];

  // add analytics provider
  addProvider(provider: AnalyticsProvider) {
    this.providers.push(provider);
  }

  // get meta tags from all providers
  getMetaTags(): ReactNode {
    return this.providers
      .filter((p) => p.getMetaTags)
      .map((p) => <Fragment key={p.name}>{p.getMetaTags!()}</Fragment>);
  }

  // get head scripts from all providers
  getHeadScripts(): ReactNode {
    return this.providers
      .filter((p) => p.getHeadScripts)
      .map((p) => <Fragment key={p.name}>{p.getHeadScripts!()}</Fragment>);
  }

  // get body scripts from all providers
  getBodyScripts(): ReactNode {
    return this.providers
      .filter((p) => p.getBodyScripts)
      .map((p) => <Fragment key={p.name}>{p.getBodyScripts!()}</Fragment>);
  }
}

export * from './google-analytics';
export * from './clarity';
export * from './plausible';
export * from './open-panel';
export * from './vercel-analytics';
