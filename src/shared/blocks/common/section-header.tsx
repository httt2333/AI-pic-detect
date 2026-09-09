import { cn } from '@/shared/lib/utils';

export function SectionHeader({
  title,
  description,
  className,
}: {
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'container space-y-6 py-16 text-center md:py-24',
        className
      )}
    >
      <h2 className="text-center text-4xl font-semibold lg:text-5xl">
        {title}
      </h2>
      <p>{description}</p>
    </div>
  );
}
