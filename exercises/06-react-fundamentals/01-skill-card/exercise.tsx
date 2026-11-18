/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 06-01 · skill-card
 * Lessons: 06.2 JSX & components · 06.3 Props, children & composition
 * Run:     npm run watch 06-01
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Build the SkillCard component from your game's skills screen. No state is
 * needed. Everything comes from props.
 *
 * Render:
 *   <article> whose accessible name is the skill name. Give the <h3> an id and
 *   point the article's aria-labelledby at it. (Tip: React's useId() hook
 *   makes a unique id. Call it at the top of the component.)
 *     - the icon in a <span aria-hidden="true">
 *     - an <h3> with the name
 *     - the text "Level {level} / {maxLevel}"            (maxLevel defaults to 99)
 *     - if level < maxLevel:
 *         a <progress> with aria-label "{name} XP", value={xp}, max={xpForNext}
 *         and the text "{xp} / {xpForNext} XP", numbers formatted with
 *         toLocaleString('en-US')  (1540 → "1,540")
 *     - if level >= maxLevel: the text "MAX" and NO progress element
 *     - if isActive: a badge with the text "Active"
 *     - a <button type="button">:
 *         isLocked → text "Locked" and disabled
 *         isActive → text "Stop"
 *         otherwise → text "Train"
 *       clicking it calls onSelect
 */

export type SkillCardProps = {
  name: string;
  icon: string;
  level: number;
  maxLevel?: number;
  xp: number;
  xpForNext: number;
  isActive?: boolean;
  isLocked?: boolean;
  onSelect: () => void;
};

export function SkillCard(props: SkillCardProps) {
  // TODO: destructure props (with defaults) and return the JSX described above
  return null;
}
