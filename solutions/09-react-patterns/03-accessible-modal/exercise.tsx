// Reference solution for 09-03. Read it only AFTER your own version passes.
import { useEffect, useId, useRef, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

export const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ open, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  // Focus in on open; restore focus on close/unmount. This synchronises with the
  // DOM's focus (an external system), so it's an effect.
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const first = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? dialogRef.current)?.focus();
    return () => previouslyFocused?.focus();
  }, [open]);

  if (!open) return null;

  function getFocusables(): HTMLElement[] {
    return Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusables = getFocusables();
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleBackdropClick(event: MouseEvent<HTMLDivElement>) {
    // Only clicks that START on the backdrop itself, not ones bubbling up from inside the dialog.
    if (event.target === event.currentTarget) onClose();
  }

  return createPortal(
    <div data-testid="modal-backdrop" className="modal-backdrop" onClick={handleBackdropClick}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} onKeyDown={handleKeyDown}>
        <h2 id={titleId}>{title}</h2>
        {children}
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>,
    document.body,
  );
}
