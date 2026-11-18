# 11.2 · Tailwind CSS

> ⏱ 3 hours · Module 11 · Styling React Apps

## What you'll learn
- Setting up Tailwind v4 with Vite
- Thinking in utilities: layout, spacing, typography, colour
- Responsive (mobile-first) prefixes, state variants and dark mode
- Customising with `@theme`
- Keeping class lists maintainable: components, `cn()`, variants, class sorting
- The rules: complete class names, and use `@apply` sparingly

---

## Setup (Vite)

```bash
npm install tailwindcss @tailwindcss/vite
```

```ts
// vite.config.ts
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

```css
/* src/index.css */
@import 'tailwindcss';
```

That's all. Tailwind v4 needs no `tailwind.config.js` by default: configuration lives **in CSS**. Install the "Tailwind CSS IntelliSense" VS Code extension (it's in this repo's recommendations) for autocomplete and hover previews of the generated CSS.

## Thinking in utilities

Each class does one thing. Here's the P1 skill card rebuilt:

```tsx
<article className="relative flex flex-col gap-2 rounded-xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
  <span aria-hidden="true" className="text-2xl">🪓</span>
  <h3 className="truncate text-lg font-semibold text-stone-900">Woodcutting</h3>
  <p className="text-sm text-stone-500 tabular-nums">Level 12 / 99</p>
  <div className="h-2 overflow-hidden rounded-full bg-stone-100">
    <div className="h-full origin-left bg-emerald-600" style={{ transform: `scaleX(${fraction})` }} />
  </div>
  <button type="button" className="mt-auto min-h-11 rounded-lg bg-emerald-600 px-4 font-medium text-white">
    Train
  </button>
</article>
```

Every class maps to CSS you already know from Module 04:

| Utility | CSS |
|---|---|
| `flex flex-col gap-2` | `display:flex; flex-direction:column; gap:0.5rem` |
| `p-4` / `px-4` / `mt-auto` | `padding:1rem` / `padding-inline:1rem` / `margin-top:auto` |
| `rounded-xl` | `border-radius:0.75rem` |
| `text-lg font-semibold` | font size and line height / `font-weight:600` |
| `truncate` | the overflow + ellipsis + nowrap trio from 04.2 |
| `tabular-nums` | `font-variant-numeric: tabular-nums` |
| `min-h-11` | `min-height: 2.75rem` (44px, a good touch target!) |
| `ring-1 ring-stone-200` | a 1px box-shadow "border" |

The spacing scale: `1` = 0.25rem (4px), `2` = 0.5rem, `4` = 1rem, `8` = 2rem… The consistency comes from the scale, and that's what makes Tailwind UIs look tidy.

## Responsive: mobile-first prefixes

Unprefixed utilities apply **everywhere**. Prefixes apply **at that breakpoint and up**, which is exactly the `min-width` mobile-first approach from 04.5:

```tsx
<ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
```

"One column on phones, two from `sm` (40rem), four from `lg` (64rem)."

The default breakpoints are `sm` 40rem, `md` 48rem, `lg` 64rem, `xl` 80rem and `2xl` 96rem. You also get:
- `max-md:hidden`: below `md` only
- **container queries**: put `@container` on a parent and `@md:flex-row` on children (04.5)
- `grid-cols-[repeat(auto-fill,minmax(10rem,1fr))]`: an arbitrary value, for the auto-fill grid from 04.4

## State variants

```tsx
<button className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50">
```

| Variant | When |
|---|---|
| `hover:` | hover (Tailwind v4 only applies it on devices that support hover, so it's safe on mobile ✅) |
| `focus-visible:` | keyboard focus |
| `active:` | while pressed (great tactile feedback on mobile) |
| `disabled:` | the disabled attribute |
| `aria-pressed:`, `aria-selected:`, `aria-expanded:` | style from ARIA state, so state and style stay in sync |
| `data-[state=open]:` | style from a data attribute (common with Radix) |
| `group-hover:` / `peer-checked:` | based on a parent marked `group` or a sibling marked `peer` |
| `motion-reduce:` / `motion-safe:` | reduced-motion preference |
| `first:` / `last:` / `odd:` | structural |

Styling from ARIA attributes is a great pattern: `aria-selected:bg-emerald-100` means the visual state can never disagree with the accessible state.

## Dark mode

By default, `dark:` follows the OS (`prefers-color-scheme`):

```tsx
<div className="bg-white text-stone-900 dark:bg-stone-900 dark:text-stone-100">
```

To let players switch manually (lesson 11.3), redefine the `dark` variant to use a `data-theme` attribute:

```css
@import 'tailwindcss';
@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));
```

## Customising: `@theme`

Add or override design tokens in CSS. They become both utilities **and** CSS variables:

```css
@import 'tailwindcss';

@theme {
  --color-wood-500: oklch(0.55 0.08 60);
  --color-ember-500: oklch(0.65 0.2 40);
  --font-display: 'Fredoka', ui-sans-serif, system-ui;
  --breakpoint-xs: 22rem;
}
```

Now `bg-wood-500`, `text-ember-500`, `font-display` and `xs:` all exist, and `var(--color-wood-500)` is available in any CSS. Lesson 11.3 builds on this.

## Keeping it maintainable

### 1. Extract components, not CSS classes
Long class lists are fine **once**, inside a component. Reuse the component, not a CSS class:

```tsx
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-xl bg-white p-4 shadow-sm ring-1 ring-stone-200 dark:bg-stone-900', className)}>{children}</div>;
}
```

### 2. `cn()`: conditional classes and conflict resolution
```bash
npm install clsx tailwind-merge
```
```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

cn('p-4 text-sm', isActive && 'ring-2 ring-emerald-500', className);
cn('p-4', 'p-2');   // → 'p-2': tailwind-merge resolves conflicts so callers can override
```

You'll see this exact helper in a huge number of codebases (shadcn/ui ships it).

### 3. Variants
For components with several visual variants, map them to class strings:

```tsx
const VARIANTS = {
  primary: 'bg-emerald-600 text-white hover:bg-emerald-700',
  secondary: 'bg-stone-100 text-stone-900 hover:bg-stone-200',
  danger: 'bg-red-600 text-white hover:bg-red-700',
} as const satisfies Record<string, string>;

type ButtonProps = ComponentProps<'button'> & { variant?: keyof typeof VARIANTS };

export function Button({ variant = 'primary', className, type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={cn('min-h-11 rounded-lg px-4 font-medium', VARIANTS[variant], className)} {...rest} />;
}
```

The `cva` library (class-variance-authority) formalises this pattern for multi-dimensional variants (variant × size).

### 4. Sort classes automatically
Install `prettier-plugin-tailwindcss` and Prettier will sort class names into a consistent order, which ends the bikeshedding.

## The rules

### Class names must be complete strings
Tailwind finds classes by **scanning your source code as text**. It doesn't run your code:

```tsx
<div className={`bg-${color}-500`} />            // ❌ "bg-emerald-500" never appears in the source, so no CSS
<div className={color === 'green' ? 'bg-emerald-500' : 'bg-red-500'} />   // ✅ complete strings
const COLORS = { green: 'bg-emerald-500', red: 'bg-red-500' };            // ✅ a lookup table
```

### Use `@apply` sparingly
`@apply` copies utilities into a custom class:

```css
.btn { @apply rounded-lg px-4 py-2 font-medium; }
```

It's tempting, but it brings back the naming and file-switching problems Tailwind solves. Prefer React components. Reasonable uses: styling HTML you don't control (Markdown output), or global base styles.

### Truly dynamic values go in `style`
```tsx
<div className="h-full bg-emerald-600 origin-left" style={{ transform: `scaleX(${fraction})` }} />
```

## Do it (in `vite-sandbox`)
- [ ] Install Tailwind v4 with the Vite plugin.
- [ ] Rebuild your P1 skill card and the bottom tab bar ↔ sidebar layout with Tailwind.
- [ ] Add `cn()` and a `Button` with three variants.
- [ ] Add a custom colour and font with `@theme`, and use them.
- [ ] Style the selected tab with `aria-selected:` or `aria-[current=page]:`.
- [ ] Install `prettier-plugin-tailwindcss` and format a file.

## Check your understanding

1. Translate `mt-4 flex items-center justify-between gap-2` into CSS.
2. Why does `` className={`text-${size}`} `` silently fail?
3. What does `twMerge` do that `clsx` doesn't?
4. A designer gives you a brand colour. Where do you put it so `bg-brand` works?

<details><summary>Answers</summary>

1. `margin-top:1rem; display:flex; align-items:center; justify-content:space-between; gap:0.5rem`.
2. Tailwind generates CSS only for class names it finds as complete strings in your source. A runtime-built string never appears in full, so its CSS isn't generated.
3. It resolves *conflicting* Tailwind classes (`p-4` + `p-2` → `p-2`), so later classes override earlier ones. `clsx` just concatenates.
4. In `@theme` in your CSS: `--color-brand: …;`. That creates `bg-brand`, `text-brand` and so on, plus the CSS variable.
</details>

## Further reading
- Tailwind docs: [Installation with Vite](https://tailwindcss.com/docs/installation/using-vite), [Responsive design](https://tailwindcss.com/docs/responsive-design), [Hover, focus & other states](https://tailwindcss.com/docs/hover-focus-and-other-states), [Dark mode](https://tailwindcss.com/docs/dark-mode), [Theme variables](https://tailwindcss.com/docs/theme)

---
[← Styling approaches](01-styling-approaches.md) · [Module overview](README.md) · [Next: Design tokens & theming →](03-design-tokens-and-theming.md)
