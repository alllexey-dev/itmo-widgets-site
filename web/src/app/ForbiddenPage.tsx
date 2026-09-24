import { Link } from 'react-router';
import type { Access } from '../features/auth/session';
import { buttonClasses, Card, EmptyState } from '../ui';

const WHO: Record<Exclude<Access, 'user'>, string> = {
  moderator: 'модераторам',
  admin: 'администратору',
};

/** A section the user's roles do not open; the backend would answer 403 anyway. */
export function ForbiddenPage({ access }: { access: Exclude<Access, 'user'> }) {
  return (
    <Card>
      <EmptyState
        icon="lock"
        title="Нет доступа"
        description={`Этот раздел доступен только ${WHO[access]}.`}
        action={
          <Link to="/" className={buttonClasses({ variant: 'tonal' })}>
            На главную
          </Link>
        }
      />
    </Card>
  );
}
