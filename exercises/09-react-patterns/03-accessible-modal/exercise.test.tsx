// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from './exercise';

function Page({ onClose = vi.fn() }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div data-testid="page">
      <button type="button" onClick={() => setOpen(true)}>
        Open shop
      </button>
      <Modal
        open={open}
        title="Village shop"
        onClose={() => {
          onClose();
          setOpen(false);
        }}
      >
        <p>Buy something nice.</p>
        <button type="button">Buy axe</button>
        <input aria-label="Quantity" />
      </Modal>
    </div>
  );
}

async function openModal() {
  await userEvent.click(screen.getByRole('button', { name: 'Open shop' }));
  return screen.getByRole('dialog', { name: 'Village shop' });
}

describe('Modal', () => {
  it('renders nothing while closed', () => {
    render(<Page />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders an accessible dialog into document.body via a portal', async () => {
    render(<Page />);
    const dialog = await openModal();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByTestId('page')).not.toContainElement(dialog);
    expect(document.body).toContainElement(dialog);
  });

  it('focuses the first focusable element when it opens', async () => {
    render(<Page />);
    await openModal();
    expect(screen.getByRole('button', { name: 'Buy axe' })).toHaveFocus();
  });

  it('closes on Escape and returns focus to the opener', async () => {
    const onClose = vi.fn();
    render(<Page onClose={onClose} />);
    await openModal();
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open shop' })).toHaveFocus();
  });

  it('closes with its Close button', async () => {
    const onClose = vi.fn();
    render(<Page onClose={onClose} />);
    await openModal();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when the backdrop is clicked, but not when the dialog is', async () => {
    const onClose = vi.fn();
    render(<Page onClose={onClose} />);
    await openModal();
    await userEvent.click(screen.getByText('Buy something nice.'));
    expect(onClose).not.toHaveBeenCalled();
    await userEvent.click(screen.getByTestId('modal-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('traps focus with Tab and Shift+Tab', async () => {
    render(<Page />);
    await openModal();
    const buy = screen.getByRole('button', { name: 'Buy axe' });
    const close = screen.getByRole('button', { name: 'Close' });
    const quantity = screen.getByRole('textbox', { name: 'Quantity' });

    expect(buy).toHaveFocus();
    await userEvent.tab();
    expect(quantity).toHaveFocus();
    await userEvent.tab();
    expect(close).toHaveFocus();
    await userEvent.tab(); // wraps
    expect(buy).toHaveFocus();
    await userEvent.tab({ shift: true }); // wraps backwards
    expect(close).toHaveFocus();
  });
});
