# Module 06 · React Fundamentals

**Time:** ~15 hours · **Prerequisites:** Part 1 (especially 01.1, 01.2 and 02.3–02.4), and the `vite-sandbox` project from 05.3

## Why this module matters
This is the start of what you're here for. React is a small library with a few powerful ideas, and you need to understand those ideas *properly* to use it well. Here you'll learn the mental model (UI as a function of state), the building blocks (components, JSX, props, state, events) and what "rendering" actually means. Every later module builds on it.

## Learning objectives
By the end of this module you can:
- explain declarative UI and why React re-renders instead of mutating the DOM
- write function components with JSX, typed props and children
- render lists with correct keys and render conditionally without bugs
- handle events and keep state with `useState`
- explain render → commit, when components re-render, and how React preserves or resets state

## Lessons
| # | Lesson | Time |
|---|---|---|
| 06.1 | [Thinking in React](01-thinking-in-react.md) | 75 min |
| 06.2 | [JSX & components](02-jsx-and-components.md) | 90 min |
| 06.3 | [Props, children & composition](03-props-children-and-composition.md) | 90 min |
| 06.4 | [Lists, keys & conditional rendering](04-lists-keys-and-conditional-rendering.md) | 90 min |
| 06.5 | [Events & state](05-events-and-state.md) | 2h |
| 06.6 | [How React renders](06-how-react-renders.md) | 2h |

## Exercises
| Id | Exercise | After lesson |
|---|---|---|
| `06-01` | [skill-card](../../exercises/06-react-fundamentals/01-skill-card/exercise.tsx) | 06.3 |
| `06-02` | [item-list](../../exercises/06-react-fundamentals/02-item-list/exercise.tsx) | 06.4 |
| `06-03` | [counter-and-toggle](../../exercises/06-react-fundamentals/03-counter-and-toggle/exercise.tsx) | 06.5 |
| `06-04` | [filterable-inventory](../../exercises/06-react-fundamentals/04-filterable-inventory/exercise.tsx) | 06.6 |

The tests use **React Testing Library**. They find elements by **role and visible text**, the way a user would. If a test can't find your button, check that it really is a `<button>` with the right text. You'll learn to write these tests yourself in Module 12.

Hints: [`exercises/06-react-fundamentals/HINTS.md`](../../exercises/06-react-fundamentals/HINTS.md)

## Checkpoint quiz
1. What does "UI is a function of state" mean?
2. Why must component names start with a capital letter?
3. What's wrong with `{items.length && <List items={items} />}`?
4. Why shouldn't you use array indexes as keys for a list that can be reordered or filtered?
5. You call `setGold(gold + 1)` and then `console.log(gold)` on the next line. What's logged, and why?
6. What two things cause a component to re-render?
7. If a parent re-renders, do its children re-render? Does the DOM necessarily change?
8. How do you reset a component's state from its parent?

<details><summary>Answers</summary>

1. Given the same state and props, a component always produces the same UI. You change the *state*, and React works out how to update the screen.
2. JSX treats lowercase tags as HTML elements (`<div>`) and capitalised tags as components (`<SkillCard>`).
3. When `items.length` is `0`, the expression evaluates to `0`, and React renders the number **0** on screen. Use `items.length > 0 && …` or a ternary.
4. Keys tell React which item is which between renders. With index keys, reordering or filtering attaches the wrong state/DOM to the wrong item (e.g. an input's text stays at position 2 while the item moves).
5. The *old* value. State is a snapshot for this render, and `setGold` schedules a re-render with the new value.
6. Its own state changing, or its parent re-rendering. (Context changes too, in Module 08.)
7. Yes, by default children re-render when a parent does. But the DOM only changes where the rendered output actually differs.
8. Give it a different `key`. A new key means a new component instance with fresh state.
</details>

## Extra practice
1. **Rebuild exercise 03-03 in React** (the bank list with sell buttons). Compare the amount of code, and notice what you no longer have to do (clearing the container, delegation, cleanup).
2. **Thinking in React kata.** Take your P1 project screen and draw the component tree on paper. For each component, list its props and say whether it needs state.
3. **Tic-tac-toe.** Do the official tutorial at react.dev/learn/tutorial-tic-tac-toe, in TypeScript.

**Next:** [Module 07 · State & Effects →](../07-state-and-effects/README.md)
