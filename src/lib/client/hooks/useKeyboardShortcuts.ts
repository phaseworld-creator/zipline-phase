import { useHotkeys } from '@mantine/hooks';
import { useNavigate } from 'react-router-dom';

/**
 * Global dashboard keyboard shortcuts.
 *
 * Ctrl+/ (or Cmd+/)  → focus the global search input
 * U                  → navigate to file upload
 * G then F           → navigate to files list
 * G then O           → navigate to folders
 * G then R           → navigate to URLs
 * G then H           → navigate to dashboard home
 */
export function useKeyboardShortcuts(opts?: {
  onSearch?: () => void;
}) {
  const navigate = useNavigate();

  useHotkeys([
    // Focus search
    ['mod+slash', () => opts?.onSearch?.()],
    // Navigate shortcuts (non-input contexts only)
    ['u', (e) => {
      if (isInputActive()) return;
      e.preventDefault();
      navigate('/dashboard/upload/file');
    }],
    ['g f', (e) => {
      if (isInputActive()) return;
      e.preventDefault();
      navigate('/dashboard/files');
    }],
    ['g o', (e) => {
      if (isInputActive()) return;
      e.preventDefault();
      navigate('/dashboard/folders');
    }],
    ['g r', (e) => {
      if (isInputActive()) return;
      e.preventDefault();
      navigate('/dashboard/urls');
    }],
    ['g h', (e) => {
      if (isInputActive()) return;
      e.preventDefault();
      navigate('/dashboard');
    }],
  ]);
}

function isInputActive(): boolean {
  const active = document.activeElement;
  if (!active) return false;
  const tag = active.tagName.toLowerCase();
  return (
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select' ||
    (active as HTMLElement).isContentEditable
  );
}
