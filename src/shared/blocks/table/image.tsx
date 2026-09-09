import { LazyImage } from '@/shared/blocks/common';
import { cn } from '@/shared/lib/utils';

export function Image({
  value,
  metadata,
  placeholder,
  className,
}: {
  value: string;
  metadata?: Record<string, any>;
  placeholder?: string;
  className?: string;
}) {
  if (!value) {
    if (placeholder) {
      return <div className={className}>{placeholder}</div>;
    }

    return null;
  }

  const width = metadata?.width || 40;
  const height = metadata?.height || 40;

  return (
    <LazyImage
      src={value}
      alt={value}
      width={width}
      height={height}
      className={cn('shrink-0 rounded-md object-cover', className)}
    />
  );
}
