import { copyToClipboard } from '@/lib/client/safeClipboard';
import { useCallback, useEffect, useState } from 'react';

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

  const copy = useCallback(() => {
    copyToClipboard(value);
    setCopied(true);
  }, [value]);

  useEffect(() => {
    if (!copied) return;

    const timer = setTimeout(() => {
      setCopied(false);
    }, timeout);

    return () => {
      clearTimeout(timer);
    };
  }, [copied, timeout]);

  return children({ copied, copy });
}
