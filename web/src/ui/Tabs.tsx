import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import styles from './Tabs.module.css';
import { cx } from './cx';

export interface TabItem<Value extends string> {
  value: Value;
  label: ReactNode;
  /** Number shown next to the label, e.g. open cases. */
  count?: number;
}

export interface TabsProps<Value extends string> {
  /** Accessible name of the tab list. */
  label: string;
  tabs: TabItem<Value>[];
  value: Value;
  onChange: (value: Value) => void;
  /** Panel content for the selected tab; omit to render only the tab list. */
  children?: ReactNode;
  className?: string;
}

export function Tabs<Value extends string>({
  label,
  tabs,
  value,
  onChange,
  children,
  className,
}: TabsProps<Value>) {
  const baseId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const tabId = (tab: Value) => `${baseId}-tab-${tab}`;
  const panelId = `${baseId}-panel`;

  const focusTab = (index: number) => {
    const next = tabs[(index + tabs.length) % tabs.length];
    if (!next) return;
    onChange(next.value);
    listRef.current?.querySelector<HTMLButtonElement>(`[id="${tabId(next.value)}"]`)?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = tabs.findIndex((tab) => tab.value === value);
    const moves: Record<string, number> = {
      ArrowRight: current + 1,
      ArrowLeft: current - 1,
      Home: 0,
      End: tabs.length - 1,
    };
    const target = moves[event.key];
    if (target === undefined) return;
    event.preventDefault();
    focusTab(target);
  };

  return (
    <div className={className}>
      <div
        ref={listRef}
        role="tablist"
        aria-label={label}
        className={styles.list}
        onKeyDown={handleKeyDown}
      >
        {tabs.map((tab) => {
          const selected = tab.value === value;
          return (
            <button
              key={tab.value}
              id={tabId(tab.value)}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={children === undefined ? undefined : panelId}
              tabIndex={selected ? 0 : -1}
              className={cx(styles.tab, selected && styles.selected)}
              onClick={() => onChange(tab.value)}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && <span className={styles.count}>{tab.count}</span>}
            </button>
          );
        })}
      </div>
      {children !== undefined && (
        <div
          id={panelId}
          role="tabpanel"
          aria-labelledby={tabId(value)}
          tabIndex={0}
          className={styles.panel}
        >
          {children}
        </div>
      )}
    </div>
  );
}
