// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bindShortcuts, onSell, onVisibilityChange, renderBank, type BankItem } from './exercise';

const items: BankItem[] = [
  { id: 'oak_log', name: 'Oak Log', quantity: 30 },
  { id: 'trout', name: 'Trout', quantity: 2 },
];

let container: HTMLElement;
beforeEach(() => {
  container = document.createElement('div');
  document.body.append(container);
});
afterEach(() => container.remove());

describe('renderBank', () => {
  it('renders one <li> per item with name, quantity and a sell button', () => {
    renderBank(container, items);
    const lis = container.querySelectorAll('ul.bank > li');
    expect(lis).toHaveLength(2);
    const first = lis[0] as HTMLElement;
    expect(first.dataset.id).toBe('oak_log');
    expect(first.querySelector('.name')?.textContent).toBe('Oak Log');
    expect(first.querySelector('.qty')?.textContent).toBe('×30');
    const button = first.querySelector('button[data-action="sell"]');
    expect(button?.textContent).toBe('Sell');
    expect(button?.getAttribute('type')).toBe('button');
  });

  it('shows an empty message when there are no items', () => {
    renderBank(container, []);
    expect(container.children).toHaveLength(1);
    expect(container.querySelector('p.empty')?.textContent).toBe('Your bank is empty');
    expect(container.querySelector('ul')).toBeNull();
  });

  it('replaces previous contents on re-render', () => {
    renderBank(container, items);
    renderBank(container, [items[1]!]);
    expect(container.querySelectorAll('li')).toHaveLength(1);
    expect(container.querySelectorAll('ul')).toHaveLength(1);
    renderBank(container, []);
    expect(container.querySelector('ul')).toBeNull();
  });

  it('renders names as text, not HTML (no XSS)', () => {
    const evil = '<img src=x onerror="alert(1)">';
    renderBank(container, [{ id: 'evil', name: evil, quantity: 1 }]);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('.name')?.textContent).toBe(evil);
  });

  it('does not add event listeners', () => {
    const spy = vi.spyOn(EventTarget.prototype, 'addEventListener');
    renderBank(container, items);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('onSell (event delegation)', () => {
  it('calls the handler with the item id when a sell button is clicked', () => {
    renderBank(container, items);
    const handler = vi.fn();
    onSell(container, handler);
    container.querySelector<HTMLButtonElement>('li[data-id="trout"] button')!.click();
    expect(handler).toHaveBeenCalledWith('trout');
  });

  it('adds exactly one listener to the container', () => {
    const spy = vi.spyOn(container, 'addEventListener');
    onSell(container, vi.fn());
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]?.[0]).toBe('click');
  });

  it('works for items rendered after the listener was attached', () => {
    const handler = vi.fn();
    onSell(container, handler);
    renderBank(container, items);
    container.querySelector<HTMLButtonElement>('li[data-id="oak_log"] button')!.click();
    expect(handler).toHaveBeenCalledWith('oak_log');
  });

  it('handles clicks on elements inside the button', () => {
    renderBank(container, items);
    const button = container.querySelector('li[data-id="trout"] button')!;
    const icon = document.createElement('span');
    button.append(icon);
    const handler = vi.fn();
    onSell(container, handler);
    icon.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(handler).toHaveBeenCalledWith('trout');
  });

  it('ignores clicks elsewhere', () => {
    renderBank(container, items);
    const handler = vi.fn();
    onSell(container, handler);
    container.querySelector<HTMLElement>('li[data-id="trout"] .name')!.click();
    container.click();
    expect(handler).not.toHaveBeenCalled();
  });

  it('stops listening after cleanup', () => {
    renderBank(container, items);
    const handler = vi.fn();
    const cleanup = onSell(container, handler);
    cleanup();
    container.querySelector<HTMLButtonElement>('button')!.click();
    expect(handler).not.toHaveBeenCalled();
  });
});

describe('bindShortcuts', () => {
  const press = (target: EventTarget, key: string) => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    target.dispatchEvent(event);
    return event;
  };

  it('calls the matching shortcut (case-insensitive) and prevents the default', () => {
    const save = vi.fn();
    bindShortcuts(document, { s: save });
    const event = press(document.body, 'S');
    expect(save).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it('ignores keys without a shortcut', () => {
    const save = vi.fn();
    bindShortcuts(document, { s: save });
    const event = press(document.body, 'x');
    expect(save).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it('ignores typing in inputs, textareas and contentEditable elements', () => {
    const save = vi.fn();
    bindShortcuts(document, { s: save });
    const input = document.createElement('input');
    const textarea = document.createElement('textarea');
    const editable = document.createElement('div');
    editable.contentEditable = 'true';
    container.append(input, textarea, editable);
    press(input, 's');
    press(textarea, 's');
    press(editable, 's');
    expect(save).not.toHaveBeenCalled();
  });

  it('stops listening after cleanup', () => {
    const save = vi.fn();
    const cleanup = bindShortcuts(document, { s: save });
    cleanup();
    press(document.body, 's');
    expect(save).not.toHaveBeenCalled();
  });
});

describe('onVisibilityChange', () => {
  let state: DocumentVisibilityState = 'visible';
  beforeEach(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
  });
  const change = (next: DocumentVisibilityState) => {
    state = next;
    document.dispatchEvent(new Event('visibilitychange'));
  };

  it('calls onHidden and onVisible as visibility changes', () => {
    const onHidden = vi.fn();
    const onVisible = vi.fn();
    onVisibilityChange(document, { onHidden, onVisible });
    change('hidden');
    expect(onHidden).toHaveBeenCalledTimes(1);
    expect(onVisible).not.toHaveBeenCalled();
    change('visible');
    expect(onVisible).toHaveBeenCalledTimes(1);
  });

  it('stops listening after cleanup', () => {
    const onHidden = vi.fn();
    const cleanup = onVisibilityChange(document, { onHidden, onVisible: vi.fn() });
    cleanup();
    change('hidden');
    expect(onHidden).not.toHaveBeenCalled();
  });
});
