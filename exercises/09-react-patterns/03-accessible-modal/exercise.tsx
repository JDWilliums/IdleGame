/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 09-03 · accessible-modal
 * Lesson:  09.4 Error boundaries, Suspense & portals
 * Run:     npm run watch 09-03
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Build a Modal by hand: a portal, focus management, a focus trap and Escape.
 * (In production you'd likely use <dialog> or a library. Building it once is
 * how you learn to judge those.)
 *
 *   <Modal open={open} onClose={() => setOpen(false)} title="Level up!">
 *     <p>Woodcutting is now level 15.</p>
 *     <button>Awesome!</button>
 *   </Modal>
 *
 * When `open` is false, render nothing.
 * When `open` is true, render INTO document.body (createPortal):
 *   <div data-testid="modal-backdrop" class="modal-backdrop">      ← fills the screen
 *     <div role="dialog" aria-modal="true" aria-labelledby={titleId}>
 *       <h2 id={titleId}>{title}</h2>
 *       {children}
 *       <button type="button">Close</button>                       ← calls onClose
 *     </div>
 *   </div>
 *
 * Behaviour:
 *   1. On open, focus the FIRST focusable element inside the dialog.
 *   2. Escape calls onClose.
 *   3. Clicking the backdrop itself calls onClose. Clicking INSIDE the dialog doesn't.
 *   4. Focus trap: Tab on the last focusable element goes to the first, and
 *      Shift+Tab on the first goes to the last.
 *   5. When the modal closes (or unmounts), focus returns to whatever was
 *      focused before it opened (usually the button that opened it).
 *
 * Focusable elements selector you can use:
 *   'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
 */
import type { ReactNode } from 'react';

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

export const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal(props: ModalProps) {
  return null; // TODO
}
