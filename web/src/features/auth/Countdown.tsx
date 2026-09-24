import styles from './Countdown.module.css';

const RADIUS = 9;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function formatSeconds(milliseconds: number): string {
  const seconds = Math.ceil(milliseconds / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export interface CountdownProps {
  /** Milliseconds left. */
  remaining: number;
  /** Full lifetime in milliseconds, for the ring. */
  total: number;
}

export function Countdown({ remaining, total }: CountdownProps) {
  const fraction = total > 0 ? remaining / total : 0;
  return (
    <p className={styles.countdown}>
      <svg className={styles.ring} viewBox="0 0 24 24" width={24} height={24} aria-hidden>
        <circle className={styles.track} cx={12} cy={12} r={RADIUS} />
        <circle
          className={styles.progress}
          cx={12}
          cy={12}
          r={RADIUS}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
        />
      </svg>
      <span>
        Код действует ещё <span className={styles.time}>{formatSeconds(remaining)}</span>
      </span>
    </p>
  );
}
