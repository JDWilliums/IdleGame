// Reference solution for 02-05. Read it only AFTER your own version passes.

export type MyPartial<T> = { [K in keyof T]?: T[K] };

export type MyReadonly<T> = { readonly [K in keyof T]: T[K] };

export type MyPick<T, K extends keyof T> = { [P in K]: T[P] };

export type MyOmit<T, K extends keyof T> = { [P in Exclude<keyof T, K>]: T[P] };

// Indexing with the union of all keys gives the union of all value types.
export type ValueOf<T> = T[keyof T];

// `infer E` captures the element type when T matches an array shape.
export type ElementOf<T> = T extends readonly (infer E)[] ? E : never;

export type Nullable<T> = T | null;

// `as` remaps each key; Capitalize turns 'click' into 'Click'.
export type Handlers<E extends string> = { [K in E as `on${Capitalize<K>}`]: () => void };

// Mapped types over arrays produce (readonly) arrays, so one rule covers both.
export type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};
