import { Fragment, ReactNode } from 'react';

/**
 * Ads configs interface
 */
export interface AdsConfigs {
  [key: string]: any;
}

// Ads provider interface
export interface AdsProvider {
  // provider name
  readonly name: string;

  // provider configs
  configs: AdsConfigs;

  // meta tags inject to head
  getMetaTags: () => ReactNode;

  // scripts inject to head
  getHeadScripts: () => ReactNode;

  // scripts inject to body
  getBodyScripts: () => ReactNode;
}

/**
 * Ads manager to manage all ads providers
 */
export class AdsManager {
  // ads providers
  private providers: AdsProvider[] = [];

  // add ads provider
  addProvider(provider: AdsProvider) {
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

export * from './adsense';
