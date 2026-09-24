import { useId } from 'react';
import { Link } from 'react-router';
import { Avatar, Badge, Card, Icon, PageHeader, Skeleton } from '../../ui';
import { displayName, hasAccess, type Session, type SessionGroup } from '../auth/session';
import { useSession } from '../auth/useSession';
import styles from './HomePage.module.css';
import { useOpenCaseCount } from './openCases';

export function HomePage() {
  const session = useSession();
  return (
    <>
      <PageHeader title="Главная" />
      <div className={styles.grid}>
        <ProfileCard session={session} />
        {hasAccess(session, 'moderator') ? <OpenCasesCard /> : <ComingSoonCard />}
      </div>
    </>
  );
}

function groupLine({ name, course, facultyShortName }: SessionGroup): string {
  return [name, course > 0 ? `${course} курс` : null, facultyShortName].filter(Boolean).join(' · ');
}

function roleLabel(session: Session): string | null {
  if (hasAccess(session, 'admin')) return 'Администратор';
  if (hasAccess(session, 'moderator')) return 'Модератор';
  return null;
}

function ProfileCard({ session }: { session: Session }) {
  const titleId = useId();
  const name = displayName(session);
  const role = roleLabel(session);
  return (
    <Card as="section" padding="large" className={styles.profile} aria-labelledby={titleId}>
      <Avatar name={name} src={session.pictureUrl} size={80} decorative />
      <div className={styles.profileText}>
        <h2 id={titleId} className={styles.name}>
          {name}
        </h2>
        <p className={styles.meta}>ИСУ {session.isu}</p>
        {session.groups.map((group) => (
          <p key={group.name} className={styles.meta}>
            {groupLine(group)}
          </p>
        ))}
        {role && (
          <Badge tone="info" className={styles.role}>
            {role}
          </Badge>
        )}
      </div>
    </Card>
  );
}

/** Hidden quietly when the queue does not load: the sidebar still leads there. */
function OpenCasesCard() {
  const count = useOpenCaseCount();
  if (count.isPending) {
    return (
      <div role="status" aria-label="Загружаем открытые заявки">
        <Skeleton className={styles.casesSkeleton} />
      </div>
    );
  }
  if (count.isError) return null;
  return (
    <Link to="/admin/moderation" className={styles.cases}>
      <span className={styles.casesLabel}>
        <Icon name="gavel" size={20} />
        Открытые заявки
      </span>
      <span className={styles.casesValue}>{count.data}</span>
      <span className={styles.casesAction}>
        Открыть очередь
        <Icon name="arrow_forward" size={18} />
      </span>
    </Link>
  );
}

function ComingSoonCard() {
  return (
    <Card as="section" padding="large" className={styles.soon} aria-label="Веб-версия">
      <span className={styles.soonIcon}>
        <Icon name="construction" />
      </span>
      <div className={styles.soonText}>
        <p className={styles.soonTitle}>Веб-версия в разработке</p>
        <p className={styles.meta}>
          Скоро здесь появятся расписание, оценки и другие разделы приложения.
        </p>
      </div>
    </Card>
  );
}
