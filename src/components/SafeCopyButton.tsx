import { copyToClipboard } from '@/lib/client/safeClipboard';
import { useCallback, useEffect, useRef, useState } from 'react';

type RenderProps = {
  copied: boolean;
  copy: () => void;
};

type Props = {
  value: string;
  timeout?: number;
  children: (props: RenderProps) => React.ReactNode;
};

/**
 * Drop-in replacement for Mantine's CopyButton that works on both
 * HTTPS (uses navigator.clipboard) and plain HTTP (execCommand fallback).
 */
export default function SafeCopyButton({ value, timeout = 2000, children }: Props) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback(() => {
    copyToClipboard(value);
    setCopied(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), timeout);
  }, [value, timeout]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return <>{children({ copied, copy })}</>;
}
