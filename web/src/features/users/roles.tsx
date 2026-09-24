import { Badge } from '../../ui';

/** Role badges, admin first; nothing for a user without roles. */
export function RoleBadges({ roles }: { roles: readonly string[] }) {
  return (
    <>
      {roles.includes('ADMIN') && (
        <Badge tone="info" icon="shield_person">
          Администратор
        </Badge>
      )}
      {roles.includes('MODERATOR') && (
        <Badge tone="success" icon="gavel">
          Модератор
        </Badge>
      )}
    </>
  );
}
