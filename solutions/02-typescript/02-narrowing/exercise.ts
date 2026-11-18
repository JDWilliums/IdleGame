// Reference solution for 02-02. Read it only AFTER your own version passes.

export type ItemStack = { itemId: string; quantity: number };

export type Reward = number | string | ItemStack | ItemStack[] | null | undefined;

export function isItemStack(value: unknown): value is ItemStack {
  return (
    typeof value === 'object' &&
    value !== null && // typeof null === 'object'!
    'itemId' in value &&
    typeof value.itemId === 'string' &&
    value.itemId.length > 0 &&
    'quantity' in value &&
    typeof value.quantity === 'number' &&
    Number.isInteger(value.quantity) &&
    value.quantity > 0
  );
}

function describeStack(stack: ItemStack): string {
  return `${stack.quantity} × ${stack.itemId}`;
}

export function describeReward(reward: Reward): string {
  if (reward === null || reward === undefined) return 'nothing';
  if (typeof reward === 'number') return `${reward} gold`; // 0 is handled correctly here
  if (typeof reward === 'string') return `1 × ${reward}`;
  if (Array.isArray(reward)) {
    return reward.length === 0 ? 'nothing' : reward.map(describeStack).join(', ');
  }
  return describeStack(reward); // only ItemStack is left
}

export function parseQuantity(input: unknown): number | null {
  if (typeof input === 'number') {
    return Number.isInteger(input) && input >= 0 ? input : null;
  }
  if (typeof input === 'string') {
    const trimmed = input.trim();
    return /^\d+$/.test(trimmed) ? Number(trimmed) : null;
  }
  return null;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }
  return 'Unknown error';
}
