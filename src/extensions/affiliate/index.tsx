import { Fragment, ReactNode } from 'react';

/**
 * Affiliate configs interface
 */
export interface AffiliateConfigs {
  [key: string]: any;
}

/**
 * Affiliate provider interface
 */
export interface AffiliateProvider {
  // provider name
  readonly name: string;

  // provider configs
  configs?: AffiliateConfigs;

  // meta tags inject to head
  getMetaTags?: () => ReactNode;

  // scripts inject to head
  getHeadScripts?: () => ReactNode;

  // scripts inject to body
  getBodyScripts?: () => ReactNode;
}

/**
 * Affiliate manager to manage all affiliate providers
 */
export class AffiliateManager {
  // affiliate providers
  private providers: AffiliateProvider[] = [];

  // add affiliate provider
  addProvider(provider: AffiliateProvider) {
    this.providers.push(provider);
  }

  // get meta tags from all affiliate providers
  getMetaTags(): ReactNode {
    return this.providers
      .filter((p) => p.getMetaTags)
      .map((p) => <Fragment key={p.name}>{p.getMetaTags!()}</Fragment>);
  }

  // get head scripts from all affiliate providers
  getHeadScripts(): ReactNode {
    return this.providers
      .filter((p) => p.getHeadScripts)
      .map((p) => <Fragment key={p.name}>{p.getHeadScripts!()}</Fragment>);
  }

  // get body scripts from all affiliate providers
  getBodyScripts(): ReactNode {
    return this.providers
      .filter((p) => p.getBodyScripts)
      .map((p) => <Fragment key={p.name}>{p.getBodyScripts!()}</Fragment>);
  }
}

export * from './affonso';
export * from './promotekit';
