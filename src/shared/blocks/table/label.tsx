import { Badge } from '@/shared/components/ui/badge';

export function Label({
  value,
  placeholder,
  metadata,
  className,
}: {
  value: string;
  placeholder?: string;
  metadata?: Record<string, any>;
  className?: string;
}) {
  if (!value) {
    if (placeholder) {
      return <div className={className}>{placeholder}</div>;
    }

    return null;
  }

  return (
    <Badge variant={metadata?.variant ?? 'secondary'} className={className}>
      {value.toString()}
    </Badge>
  );
}
