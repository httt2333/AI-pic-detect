import { Fragment, ReactNode } from 'react';

/**
 * Customer service configs interface
 */
export interface CustomerServiceConfigs {
  [key: string]: any;
}

/**
 * Customer service provider interface
 */
export interface CustomerServiceProvider {
  // provider name
  readonly name: string;

  // provider configs
  configs?: CustomerServiceConfigs;

  // meta tags inject to head
  getMetaTags?: () => ReactNode;

  // scripts inject to head
  getHeadScripts?: () => ReactNode;

  // scripts inject to body
  getBodyScripts?: () => ReactNode;
}

/**
 * Customer service manager to manage all customer service providers
 */
export class CustomerServiceManager {
  // customer service providers
  private providers: CustomerServiceProvider[] = [];

  // add affiliate provider
  addProvider(provider: CustomerServiceProvider) {
    this.providers.push(provider);
  }

  // get meta tags from all customer service providers
  getMetaTags(): ReactNode {
    return this.providers
      .filter((p) => p.getMetaTags)
      .map((p) => <Fragment key={p.name}>{p.getMetaTags!()}</Fragment>);
  }

  // get head scripts from all customer service providers
  getHeadScripts(): ReactNode {
    return this.providers
      .filter((p) => p.getHeadScripts)
      .map((p) => <Fragment key={p.name}>{p.getHeadScripts!()}</Fragment>);
  }

  // get body scripts from all customer service providers
  getBodyScripts(): ReactNode {
    return this.providers
      .filter((p) => p.getBodyScripts)
      .map((p) => <Fragment key={p.name}>{p.getBodyScripts!()}</Fragment>);
  }
}

export * from './tawk';
export * from './crisp';
