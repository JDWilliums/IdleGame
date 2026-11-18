// Reference solution for 02-03. Read it only AFTER your own version passes.

export type SkillId = 'woodcutting' | 'fishing' | 'mining';

export type GameAction =
  | { type: 'startAction'; skillId: SkillId; actionId: string }
  | { type: 'stopAction' }
  | { type: 'gainXp'; skillId: SkillId; amount: number }
  | { type: 'addItem'; itemId: string; quantity: number }
  | { type: 'sellItem'; itemId: string; quantity: number; pricePerItem: number };

export type GameState = {
  active: { skillId: SkillId; actionId: string } | null;
  xp: Record<SkillId, number>;
  bank: Record<string, number>;
  gold: number;
};

export function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`);
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'startAction':
      return { ...state, active: { skillId: action.skillId, actionId: action.actionId } };

    case 'stopAction':
      return state.active === null ? state : { ...state, active: null };

    case 'gainXp':
      return {
        ...state,
        xp: { ...state.xp, [action.skillId]: state.xp[action.skillId] + action.amount },
      };

    case 'addItem':
      return {
        ...state,
        bank: { ...state.bank, [action.itemId]: (state.bank[action.itemId] ?? 0) + action.quantity },
      };

    case 'sellItem': {
      // Braces give this case its own block scope for `const`s.
      const have = state.bank[action.itemId] ?? 0;
      if (have < action.quantity) return state;
      const remaining = have - action.quantity;
      const { [action.itemId]: _sold, ...rest } = state.bank;
      return {
        ...state,
        bank: remaining === 0 ? rest : { ...state.bank, [action.itemId]: remaining },
        gold: state.gold + action.quantity * action.pricePerItem,
      };
    }

    default:
      return assertNever(action);
  }
}

export function describeAction(action: GameAction): string {
  switch (action.type) {
    case 'startAction':
      return `Started ${action.skillId}: ${action.actionId}`;
    case 'stopAction':
      return 'Stopped';
    case 'gainXp':
      return `+${action.amount} ${action.skillId} XP`;
    case 'addItem':
      return `+${action.quantity} ${action.itemId}`;
    case 'sellItem':
      return `Sold ${action.quantity} ${action.itemId} for ${action.quantity * action.pricePerItem} gold`;
    default:
      return assertNever(action);
  }
}

export type LoadState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

export function loadStateLabel(state: LoadState<string[]>): string {
  switch (state.status) {
    case 'idle':
      return 'Not loaded';
    case 'loading':
      return 'Loading…';
    case 'success': {
      const n = state.data.length;
      return `${n} ${n === 1 ? 'save' : 'saves'} found`;
    }
    case 'error':
      return `Error: ${state.error}`;
    default:
      return assertNever(state);
  }
}
