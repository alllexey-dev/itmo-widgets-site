import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { displayName, type Session } from '../features/auth/session';
import { useLogout } from '../features/auth/useSession';
import { Avatar, cx, Icon, useTheme, useToast, type ThemePreference } from '../ui';
import styles from './AccountMenu.module.css';

const THEMES: { value: ThemePreference; label: string; icon: string }[] = [
  { value: 'system', label: 'Как в системе', icon: 'brightness_auto' },
  { value: 'light', label: 'Светлая', icon: 'light_mode' },
  { value: 'dark', label: 'Тёмная', icon: 'dark_mode' },
];

export function AccountMenu({ session }: { session: Session }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const { preference, setPreference } = useTheme();
  const toast = useToast();
  const logout = useLogout();
  const name = displayName(session);

  const close = (restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) buttonRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>('[role^="menuitem"]')?.focus();
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]') ?? [],
    );
    const index = items.indexOf(document.activeElement as HTMLElement);
    const moves: Record<string, number> = {
      ArrowDown: index + 1,
      ArrowUp: index - 1,
      Home: 0,
      End: items.length - 1,
    };
    if (event.key === 'Escape') {
      event.preventDefault();
      close(true);
    } else if (event.key === 'Tab') {
      close(false);
    } else if (moves[event.key] !== undefined) {
      event.preventDefault();
      const target = ((moves[event.key] ?? 0) + items.length) % items.length;
      items[target]?.focus();
    }
  };

  const handleLogout = () => {
    logout.mutate(undefined, {
      onError: (error) =>
        toast.show({ message: `Не удалось выйти: ${error.message}`, tone: 'error' }),
    });
  };

  return (
    <div className={styles.anchor}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Аккаунт: ${name}`}
        onClick={() => setOpen((value) => !value)}
      >
        <Avatar name={name} src={session.pictureUrl} size={40} decorative />
      </button>
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="Аккаунт"
          className={styles.menu}
          onKeyDown={handleMenuKeyDown}
        >
          <div className={styles.profile}>
            <Avatar name={name} src={session.pictureUrl} size={40} decorative />
            <div className={styles.profileText}>
              <span className={styles.name}>{name}</span>
              <span className={styles.meta}>ИСУ {session.isu}</span>
            </div>
          </div>
          <div role="group" aria-label="Тема" className={styles.section}>
            <span className={styles.sectionTitle} aria-hidden>
              Тема
            </span>
            {THEMES.map((theme) => {
              const checked = preference === theme.value;
              return (
                <button
                  key={theme.value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={checked}
                  tabIndex={-1}
                  className={cx(styles.item, checked && styles.checked)}
                  onClick={() => setPreference(theme.value)}
                >
                  <Icon name={theme.icon} filled={checked} size={20} />
                  <span>{theme.label}</span>
                  {checked && <Icon name="check" size={20} className={styles.check} />}
                </button>
              );
            })}
          </div>
          <div className={styles.section}>
            <button
              type="button"
              role="menuitem"
              tabIndex={-1}
              className={styles.item}
              disabled={logout.isPending}
              onClick={handleLogout}
            >
              <Icon name="logout" size={20} />
              <span>Выйти</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
