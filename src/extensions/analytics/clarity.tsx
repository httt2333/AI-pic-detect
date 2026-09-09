import { ReactNode } from 'react';
import Script from 'next/script';

import { AnalyticsConfigs, AnalyticsProvider } from '.';

/**
 * Clarity analytics configs
 * @docs https://clarity.microsoft.com/
 */
export interface ClarityAnalyticsConfigs extends AnalyticsConfigs {
  clarityId: string; // clarity id
}

/**
 * Clarity analytics provider
 * @website https://clarity.microsoft.com/
 */
export class ClarityAnalyticsProvider implements AnalyticsProvider {
  readonly name = 'clarity';

  configs: ClarityAnalyticsConfigs;

  constructor(configs: ClarityAnalyticsConfigs) {
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
                (function(c,l,a,r,i,t,y){
                    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                })(window, document, "clarity", "script", "${this.configs.clarityId}");
            `,
          }}
        />
      </>
    );
  }
}
