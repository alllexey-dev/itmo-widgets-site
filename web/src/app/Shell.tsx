import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { ApiError } from '../api/client';
import { SessionContext, useSessionQuery } from '../features/auth/useSession';
import type { Session } from '../features/auth/session';
import { Button, cx, EmptyState, IconButton, Icon, Skeleton, trapTab } from '../ui';
import { AccountMenu } from './AccountMenu';
import { visibleNavGroups } from './navigation';
import styles from './Shell.module.css';

const DESKTOP_QUERY = '(min-width: 760px)';

export function Shell() {
  const session = useSessionQuery();
  const location = useLocation();
  // The drawer belongs to the page it was opened on, so navigation closes it.
  const [drawerPath, setDrawerPath] = useState<string | null>(null);
  const drawerOpen = drawerPath === location.pathname;
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);

  const closeDrawer = useCallback(() => setDrawerPath(null), []);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia(DESKTOP_QUERY);
    const handleChange = () => {
      if (query.matches) closeDrawer();
    };
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, [closeDrawer]);

  useEffect(() => {
    if (!drawerOpen) return;
    const nav = navRef.current;
    nav?.querySelector<HTMLElement>('a')?.focus();
    const menuButton = menuButtonRef.current;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDrawer();
        menuButton?.focus();
        return;
      }
      if (nav) trapTab(event, nav);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen, closeDrawer]);

  return (
    <div className={styles.shell}>
      <a className={styles.skip} href="#main">
        К содержимому
      </a>
      <nav
        ref={navRef}
        id="app-navigation"
        className={cx(styles.nav, drawerOpen && styles.navOpen)}
        aria-label="Разделы"
      >
        <div className={styles.brand}>
          <img src={`${import.meta.env.BASE_URL}favicon.png`} alt="" width={32} height={32} />
          <span>ITMO.Widgets</span>
        </div>
        {session.data ? <NavGroups session={session.data} /> : <NavSkeleton />}
      </nav>
      {drawerOpen && <div className={styles.scrim} aria-hidden onClick={closeDrawer} />}
      <div className={styles.column}>
        <header className={styles.topbar}>
          <IconButton
            ref={menuButtonRef}
            className={styles.menuButton}
            icon="menu"
            label="Меню"
            aria-expanded={drawerOpen}
            aria-controls="app-navigation"
            onClick={() => setDrawerPath(drawerOpen ? null : location.pathname)}
          />
          <span className={styles.topbarBrand}>ITMO.Widgets</span>
          <div className={styles.spacer} />
          {session.data && <AccountMenu session={session.data} />}
        </header>
        <main id="main" className={styles.main} tabIndex={-1}>
          <ShellContent session={session} />
        </main>
      </div>
    </div>
  );
}

function ShellContent({ session }: { session: ReturnType<typeof useSessionQuery> }) {
  if (session.data) {
    return (
      <SessionContext.Provider value={session.data}>
        <Outlet />
      </SessionContext.Provider>
    );
  }
  const error = session.error;
  const redirecting = error instanceof ApiError && (error.isUnauthorized || error.isForbidden);
  if (error && !redirecting) {
    return (
      <EmptyState
        icon="cloud_off"
        title="Не удалось загрузить профиль"
        description={error.message}
        action={
          <Button variant="tonal" icon="refresh" onClick={() => void session.refetch()}>
            Повторить
          </Button>
        }
      />
    );
  }
  return (
    <div className={styles.loading} aria-busy="true" aria-label="Загрузка">
      <Skeleton width="40%" height={36} />
      <Skeleton height={160} />
    </div>
  );
}

function NavGroups({ session }: { session: Session }) {
  return (
    <div className={styles.groups}>
      {visibleNavGroups(session).map((group) => (
        <ul key={group[0]?.path} className={styles.group}>
          {group.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => cx(styles.link, isActive && styles.active)}
              >
                {({ isActive }) => (
                  <>
                    <Icon name={item.icon} filled={isActive} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}

function NavSkeleton() {
  return (
    <div className={styles.groups} aria-hidden>
      {[0, 1, 2].map((index) => (
        <Skeleton key={index} height={48} />
      ))}
    </div>
  );
}
