export function JsonPreview({
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

  if (typeof value !== 'string') {
    return <div className={className}>{value}</div>;
  }

  try {
    const json = JSON.parse(value);
    return <pre className={className}>{JSON.stringify(json, null, 2)}</pre>;
  } catch (error) {
    return <div className={className}>{value}</div>;
  }
}
