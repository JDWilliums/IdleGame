// Type tests for 02-03. Every line here must compile.
//   Expect<Equal<A, B>>          fails unless A and B are exactly the same type.
//   A "ts-expect-error" comment  means the NEXT line MUST be a type error.
import type { Equal, Expect } from '../../_support/type-assertions';
import { assertNever, type LoadState } from './exercise';

type _t1 = Expect<Equal<typeof assertNever, (value: never) => never>>;

export const idle: LoadState<number> = { status: 'idle' };
export const loading: LoadState<number> = { status: 'loading' };
export const success: LoadState<number> = { status: 'success', data: 42 };
export const failure: LoadState<number> = { status: 'error', error: 'offline' };

// @ts-expect-error: success requires data
export const noData: LoadState<number> = { status: 'success' };
// @ts-expect-error: error requires an error message
export const noError: LoadState<number> = { status: 'error' };
// @ts-expect-error: loading has no data
export const loadingWithData: LoadState<number> = { status: 'loading', data: 1 };
// @ts-expect-error: data must be T
export const wrongData: LoadState<number> = { status: 'success', data: 'nope' };

type _t2 = Expect<Equal<Extract<LoadState<string>, { status: 'success' }>['data'], string>>;
type _t3 = Expect<Equal<LoadState<number>['status'], 'idle' | 'loading' | 'success' | 'error'>>;
