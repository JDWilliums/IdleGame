// Reference solution for 03-03. Read it only AFTER your own version passes.

export type BankItem = { id: string; name: string; quantity: number };

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: { className?: string; text?: string } = {},
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (props.className) node.className = props.className;
  if (props.text !== undefined) node.textContent = props.text; // textContent = no XSS
  return node;
}

export function renderBank(container: HTMLElement, items: readonly BankItem[]): void {
  if (items.length === 0) {
    container.replaceChildren(el('p', { className: 'empty', text: 'Your bank is empty' }));
    return;
  }

  const list = el('ul', { className: 'bank' });
  for (const item of items) {
    const li = el('li');
    li.dataset.id = item.id;

    const sell = el('button', { text: 'Sell' });
    sell.type = 'button';
    sell.dataset.action = 'sell';

    li.append(
      el('span', { className: 'name', text: item.name }),
      el('span', { className: 'qty', text: `×${item.quantity}` }),
      sell,
    );
    list.append(li);
  }
  // Build everything off-DOM, then swap it in with one DOM operation.
  container.replaceChildren(list);
}

export function onSell(container: HTMLElement, handler: (itemId: string) => void): () => void {
  function onClick(event: MouseEvent) {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest('button[data-action="sell"]');
    if (!button || !container.contains(button)) return;
    const id = button.closest('li')?.dataset.id;
    if (id) handler(id);
  }
  container.addEventListener('click', onClick);
  return () => container.removeEventListener('click', onClick);
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target.isContentEditable ||
    target.contentEditable === 'true' // jsdom doesn't implement isContentEditable
  );
}

export function bindShortcuts(
  target: EventTarget,
  shortcuts: Record<string, () => void>,
): () => void {
  function onKeyDown(event: Event) {
    if (!(event instanceof KeyboardEvent) || isTypingTarget(event.target)) return;
    const action = shortcuts[event.key.toLowerCase()];
    if (action) {
      event.preventDefault();
      action();
    }
  }
  target.addEventListener('keydown', onKeyDown);
  return () => target.removeEventListener('keydown', onKeyDown);
}

export function onVisibilityChange(
  doc: Document,
  callbacks: { onHidden: () => void; onVisible: () => void },
): () => void {
  function onChange() {
    if (doc.visibilityState === 'hidden') callbacks.onHidden();
    else callbacks.onVisible();
  }
  doc.addEventListener('visibilitychange', onChange);
  return () => doc.removeEventListener('visibilitychange', onChange);
}
