# 01.2 · Functions & closures

> ⏱ 90 min · Module 01 · JavaScript You'll Use Every Day

## What you'll learn
- Function declarations vs arrow functions, and when each is used
- Higher-order functions and callbacks
- Scope, and exactly what a **closure** captures
- Classic closure patterns: private state, `once`, `memoize`, `debounce`
- A preview of the **stale closure**, the bug behind most `setInterval` problems in React

---

## Functions are values

In JavaScript, functions are values like numbers or strings. You can store them in variables, pass them as arguments, and return them from other functions.

```js
// Function declaration: hoisted (usable before the line it's defined on)
function add(a, b) {
  return a + b;
}

// Arrow function stored in a const: not hoisted
const multiply = (a, b) => a * b;

// Arrow with a body
const describe = (item) => {
  const label = item.name.toUpperCase();
  return `${label} x${item.qty}`;
};

// Returning an object literal from an arrow needs parentheses
const makeItem = (name) => ({ name, qty: 1 });
```

In React code you'll see **both**. A common convention: `function` declarations for components (`function SkillCard() {}`) and arrow functions for callbacks (`onClick={() => chop()}`).

Useful parameter features:

```js
function grantXp(skill, amount = 10, ...bonuses) {  // default + rest params
  return amount + bonuses.reduce((a, b) => a + b, 0);
}
grantXp('fishing');          // 10
grantXp('fishing', 5, 1, 2); // 8
```

## Higher-order functions

A **higher-order function** takes a function as an argument or returns one. You use them constantly: `map`, `filter`, `addEventListener`, `setTimeout`, and in React every `onClick`.

```js
function repeat(times, action) {
  for (let i = 0; i < times; i++) action(i);
}
repeat(3, (i) => console.log(`chop #${i}`));
```

## Scope

`let` and `const` are **block-scoped**: they exist only inside the nearest `{ }`.

```js
if (true) {
  const secret = 42;
}
console.log(secret); // ReferenceError
```

Functions can see variables from the scopes **around where they were written** (not where they're called). This is **lexical scope**:

```js
const multiplier = 2;
function double(x) {
  return x * multiplier;   // looks "outward" and finds multiplier
}
```

> Forget `var`. It's function-scoped and hoisted in confusing ways. Modern code uses `const` by default and `let` when you need to reassign.

## Closures

A **closure** is a function bundled with the variables from the scope it was created in. The function "closes over" those variables and keeps access to them **even after the outer function has returned**.

```js
function createCounter() {
  let count = 0;                 // lives in createCounter's scope
  return function increment() {
    count += 1;                  // still accessible later!
    return count;
  };
}

const counter = createCounter();
counter(); // 1
counter(); // 2

const other = createCounter();   // a brand-new scope, so a separate count
other();   // 1
```

Every call to `createCounter` creates a **new** `count` variable, and each returned function holds onto its own. Nothing outside can touch `count` directly, so it's truly private.

### The key question: value or variable?

A closure captures the **variable** (the binding), not a snapshot of its value:

```js
let level = 1;
const report = () => console.log(`Level ${level}`);
level = 2;
report(); // "Level 2": it reads the variable's CURRENT value
```

But if each call creates a **new variable**, each closure sees its own:

```js
function makeReporter(level) {        // `level` is a new variable on each call
  return () => console.log(`Level ${level}`);
}
const r1 = makeReporter(1);
const r2 = makeReporter(2);
r1(); // "Level 1"
r2(); // "Level 2"
```

### Preview: the stale closure

This second pattern is exactly how React works. **Every render of a component is a new function call**, with new variables. A callback created during render 1 captures render 1's variables, *forever*:

```js
// Pseudo-React: imagine React calls Game() each time state changes
function Game(renderNumber, gold) {
  // A timer created during THIS render...
  setInterval(() => {
    console.log(`gold is ${gold}`);  // ...always sees THIS render's `gold`
  }, 1000);
}
Game(1, 0);     // the interval logs "gold is 0" forever,
Game(2, 50);    // even though a later render has gold = 50
```

This is a **stale closure**. In lesson 07.6 you'll see it bite in real React code and learn the fixes. For now, remember: **a closure sees the variables of the call that created it.**

### Closures in loops

```js
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);  // 0, 1, 2: `let` makes a new `i` per iteration
}
for (var j = 0; j < 3; j++) {
  setTimeout(() => console.log(j), 0);  // 3, 3, 3: one shared `j`
}
```

That's a classic interview question, and another reason to never use `var`.

## Closure patterns you'll actually use

### `once`: run a function only the first time
```js
function once(fn) {
  let called = false;
  let result;
  return (...args) => {
    if (!called) {
      called = true;
      result = fn(...args);
    }
    return result;
  };
}
const initGame = once(() => console.log('Game started'));
initGame(); // logs
initGame(); // does nothing
```

### Memoize: cache expensive results
```js
function memoize(fn) {
  const cache = new Map();          // private to this memoized function
  return (arg) => {
    if (cache.has(arg)) return cache.get(arg);
    const result = fn(arg);
    cache.set(arg, result);
    return result;
  };
}
const xpForLevel = memoize((level) => /* expensive maths */ level ** 3);
```

### Debounce: wait until calls stop
"Run this only after the user has stopped doing X for `ms` milliseconds." Used for search boxes, resize handlers and, in your game, **autosaving after a burst of changes**.

```js
function debounce(fn, ms) {
  let timer;                          // shared across calls via the closure
  return (...args) => {
    clearTimeout(timer);              // cancel the previous pending call
    timer = setTimeout(() => fn(...args), ms);
  };
}
const saveSoon = debounce(save, 2000);
saveSoon(); saveSoon(); saveSoon();   // only ONE save, 2s after the last call
```

## A word on `this`

`this` refers to the object a function was called **on**, and it trips everyone up:

```js
const player = {
  name: 'Ava',
  greet() { return `Hi, ${this.name}`; },
};
player.greet();                  // "Hi, Ava"
const g = player.greet;
g();                             // "Hi, undefined": called on nothing
```

Arrow functions **don't have their own `this`**. They use the `this` of the surrounding code. The good news is that modern React (function components and hooks) almost never uses `this`. Know what it is for interviews and for reading older class-based code, then move on.

## ⚠️ Common mistakes

```js
// 1. Calling instead of passing a function
button.addEventListener('click', handleClick());  // calls it NOW, passes undefined
button.addEventListener('click', handleClick);    // ✅ passes the function

// 2. Forgetting to return from a multi-line arrow
const total = items.map((i) => { i.price * i.qty });  // array of undefined!
const total2 = items.map((i) => i.price * i.qty);     // ✅ implicit return

// 3. Expecting a closure to "update" when the outer function re-runs
//    Each run creates NEW variables, and old closures keep the OLD ones.
```

## Check your understanding

1. What's the output? `const fns = []; for (let i = 0; i < 3; i++) fns.push(() => i); console.log(fns.map(f => f()));`
2. In `createCounter`, why can't outside code reset `count` to 0?
3. In `debounce`, why must `timer` be declared *outside* the returned function?
4. In one sentence: what is a stale closure?

<details><summary>Answers</summary>

1. `[0, 1, 2]`. `let` creates a fresh `i` for each loop iteration, and each arrow captures its own.
2. `count` only exists in the scope of that `createCounter` call. The only code that can reach it is the returned function, so it's effectively private.
3. It must persist and be **shared between calls** so each call can cancel the previous timer. Declared inside, each call would get a new, empty `timer`.
4. A function that captured variables from an earlier call (or render) and keeps using those old values after newer ones exist.
</details>

## Further reading
- MDN: [Closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures)
- MDN: [Arrow function expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)
- MDN: [`this`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this)

**Practice:** exercise `01-02` closures → `npm run watch 01-02`

---
[← Values, references & immutability](01-values-references-and-immutability.md) · [Module overview](README.md) · [Next: Array & object power tools →](03-arrays-and-objects-power-tools.md)
