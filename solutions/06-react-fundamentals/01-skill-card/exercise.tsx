// Reference solution for 06-01. Read it only AFTER your own version passes.
import { useId } from 'react';

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

const format = (n: number) => n.toLocaleString('en-US');

export function SkillCard({
  name,
  icon,
  level,
  maxLevel = 99,
  xp,
  xpForNext,
  isActive = false,
  isLocked = false,
  onSelect,
}: SkillCardProps) {
  const headingId = useId(); // unique per instance, stable across renders
  const isMaxed = level >= maxLevel;
  const buttonLabel = isLocked ? 'Locked' : isActive ? 'Stop' : 'Train';

  return (
    <article
      aria-labelledby={headingId}
      className={isActive ? 'skill-card skill-card--active' : 'skill-card'}
    >
      <span aria-hidden="true">{icon}</span>
      <h3 id={headingId}>{name}</h3>
      {isActive && <span className="badge">Active</span>}
      <p>
        Level {level} / {maxLevel}
      </p>

      {isMaxed ? (
        <p>MAX</p>
      ) : (
        <>
          <progress aria-label={`${name} XP`} value={xp} max={xpForNext} />
          <p>
            {format(xp)} / {format(xpForNext)} XP
          </p>
        </>
      )}

      <button type="button" onClick={onSelect} disabled={isLocked}>
        {buttonLabel}
      </button>
    </article>
  );
}
