'use client';

import { useEffect, useRef } from 'react';
// @ts-ignore
import { OverType } from 'overtype';

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  minHeight = 400,
  showToolbar,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  showToolbar?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const editorRef = useRef<OverType>(null);

  useEffect(() => {
    const [instance] = OverType.init(ref.current, {
      value,
      onChange,
      placeholder,
      minHeight,
      showToolbar,
    });
    editorRef.current = instance;

    return () => editorRef.current?.destroy();
  }, []);

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.getValue()) {
      editorRef.current.setValue(value);
    }
  }, [value]);

  return (
    <div
      className="overflow-hidden rounded-md border"
      ref={ref}
      style={{ height: '400px' }}
    />
  );
}
