import { Link } from '@/core/i18n/navigation';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';

import { SmartIcon } from './smart-icon';

export function PageHeader({
  title,
  description,
  buttons,
  className,
}: {
  title?: string;
  description?: string;
  buttons?: {
    title?: string;
    url?: string;
    target?: string;
    variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive';
    icon?: string;
  }[];
  className?: string;
}) {
  return (
    <section className={cn('py-16 md:py-32', className)}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-4xl space-y-6 text-center">
          <h1 className="text-center text-4xl font-semibold lg:text-5xl">
            {title}
          </h1>
          <p>{description}</p>
          <div className="flex justify-center">
            {buttons?.map((button, idx) => (
              <Button key={idx} {...button} asChild>
                <Link href={button.url || ''} target={button.target || '_self'}>
                  {button.icon && <SmartIcon name={button.icon} />}
                  {button.title}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
