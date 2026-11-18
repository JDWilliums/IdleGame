// Type tests for 02-05. Every line here must compile.
//   Expect<Equal<A, B>>          fails unless A and B are exactly the same type.
//   A "ts-expect-error" comment  means the NEXT line MUST be a type error.
import type { Equal, Expect } from '../../_support/type-assertions';
import type {
  DeepReadonly,
  ElementOf,
  Handlers,
  MyOmit,
  MyPartial,
  MyPick,
  MyReadonly,
  Nullable,
  ValueOf,
} from './exercise';

type User = { id: string; name: string; level: number };

// 1
type _t1 = Expect<Equal<MyPartial<User>, { id?: string; name?: string; level?: number }>>;
// 2
type _t2 = Expect<Equal<MyReadonly<User>, { readonly id: string; readonly name: string; readonly level: number }>>;
// 3
type _t3 = Expect<Equal<MyPick<User, 'id' | 'level'>, { id: string; level: number }>>;
// @ts-expect-error: 'email' is not a key of User
type _t3err = MyPick<User, 'email'>;
// 4
type _t4 = Expect<Equal<MyOmit<User, 'id'>, { name: string; level: number }>>;
// 5
type _t5 = Expect<Equal<ValueOf<{ a: 1; b: 'x'; c: boolean }>, 1 | 'x' | boolean>>;
// 6
type _t6a = Expect<Equal<ElementOf<string[]>, string>>;
type _t6b = Expect<Equal<ElementOf<readonly (1 | 2)[]>, 1 | 2>>;
type _t6c = Expect<Equal<ElementOf<number>, never>>;
// 7
type _t7 = Expect<Equal<Nullable<string>, string | null>>;
// 8
type _t8 = Expect<Equal<Handlers<'click' | 'hover'>, { onClick: () => void; onHover: () => void }>>;
// 9
type Save = { player: { name: string; skills: { id: string; xp: number }[] }; gold: number };
type _t9 = Expect<
  Equal<
    DeepReadonly<Save>,
    {
      readonly player: {
        readonly name: string;
        readonly skills: readonly { readonly id: string; readonly xp: number }[];
      };
      readonly gold: number;
    }
  >
>;
