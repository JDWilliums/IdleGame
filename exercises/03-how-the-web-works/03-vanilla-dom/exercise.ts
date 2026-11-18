/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 03-03 · vanilla-dom
 * Lesson:  03.3 The browser: DOM, events & storage
 * Run:     npm run watch 03-03
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Build a tiny bank UI with NO framework. You'll feel exactly what React does
 * for you, and the "setup returns cleanup" pattern here is the same one
 * useEffect uses in Module 07. (Tests run in jsdom, a simulated browser.)
 *
 * TASK 1 · renderBank(container, items)
 *   Replace everything inside `container`.
 *   - No items → exactly one  <p class="empty">Your bank is empty</p>
 *   - Otherwise → one <ul class="bank"> containing, per item:
 *       <li data-id="{id}">
 *         <span class="name">{name}</span>
 *         <span class="qty">×{quantity}</span>
 *         <button type="button" data-action="sell">Sell</button>
 *       </li>
 *   Use textContent, never innerHTML with item data (a test uses a malicious
 *   item name). renderBank must NOT add any event listeners.
 *
 * TASK 2 · onSell(container, handler) → cleanup function
 *   Use EVENT DELEGATION: add ONE click listener to `container`. When a click
 *   lands on a sell button (or anything inside it), call handler(itemId) with
 *   the `data-id` of its <li>. Ignore other clicks. Because it's delegated, it
 *   must also work for items rendered AFTER onSell was called.
 *   The returned function removes the listener.
 *
 * TASK 3 · bindShortcuts(target, shortcuts) → cleanup function
 *   Listen for 'keydown' on `target`. If event.key, lowercased, is a key in
 *   `shortcuts`, call that function and preventDefault(). IGNORE the event if
 *   it came from an <input>, <textarea> or contentEditable element (so the
 *   player can type an "s" in a text field without triggering "sell").
 *   The returned function removes the listener.
 *
 * TASK 4 · onVisibilityChange(doc, { onHidden, onVisible }) → cleanup function
 *   Listen for 'visibilitychange' on `doc` and call onHidden/onVisible based
 *   on doc.visibilityState. The returned function removes the listener.
 */

export type BankItem = { id: string; name: string; quantity: number };

export function renderBank(container: HTMLElement, items: readonly BankItem[]): void {
  throw new Error('Not implemented yet');
}

export function onSell(container: HTMLElement, handler: (itemId: string) => void): () => void {
  throw new Error('Not implemented yet');
}

export function bindShortcuts(
  target: EventTarget,
  shortcuts: Record<string, () => void>,
): () => void {
  throw new Error('Not implemented yet');
}

export function onVisibilityChange(
  doc: Document,
  callbacks: { onHidden: () => void; onVisible: () => void },
): () => void {
  throw new Error('Not implemented yet');
}
