import { Link } from 'react-router';
import {
  Avatar,
  Badge,
  buttonClasses,
  DiffView,
  formatDate,
  formatDateTime,
  formatRelative,
  Icon,
  type DiffRow,
} from '../../ui';
import {
  CAPABILITIES,
  ACTIONS,
  CATEGORIES,
  hostOf,
  REPORT_REASONS,
  visibilityLabel,
} from './labels';
import styles from './CaseDetail.module.css';
import type {
  ModerationDecision,
  ModerationReport,
  SubjectLink,
  SubjectLinkRevision,
  SubjectLinkTarget,
  UserRestriction,
} from './types';

/** The flow name is known only for the link's current flow. */
function revisionVisibility(revision: SubjectLinkRevision, link: SubjectLink): string {
  const label = revision.flowId === link.flowId ? link.audienceLabel : null;
  return visibilityLabel(revision.visibility, label);
}

function UrlText({ url }: { url: string }) {
  const host = hostOf(url);
  if (!host) return <span className={styles.url}>{url}</span>;
  const [before, ...rest] = url.split(host);
  return (
    <span className={styles.url} title={url}>
      <span className={styles.urlMuted}>{before}</span>
      <span className={styles.urlHost}>{host}</span>
      <span className={styles.urlMuted}>{rest.join(host)}</span>
    </span>
  );
}

export function LinkPreview({ target }: { target: SubjectLinkTarget }) {
  const { revision, link } = target;
  const category = CATEGORIES[revision.category];
  const hidden = link.status === 'HIDDEN';
  return (
    <section className={styles.preview} aria-label="Ссылка">
      <div className={styles.previewHead}>
        <span className={styles.categoryIcon}>
          <Icon name={category.icon} />
        </span>
        <div className={styles.previewText}>
          <span className={styles.category}>{category.label}</span>
          <span className={styles.previewTitle}>{revision.title?.trim() || 'Без названия'}</span>
          <UrlText url={revision.url} />
        </div>
        <a
          href={revision.url}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses({ variant: 'tonal', size: 'small' })}
        >
          <Icon name="open_in_new" size={18} />
          Открыть
        </a>
      </div>
      <dl className={styles.facts}>
        <div>
          <dt>Кто видит</dt>
          <dd>{revisionVisibility(revision, link)}</dd>
        </div>
        <div>
          <dt>Версия</dt>
          <dd>
            № {revision.number} · {formatRelative(revision.submittedAt)}
          </dd>
        </div>
        <div>
          <dt>Рейтинг</dt>
          <dd>{link.score > 0 ? `+${link.score}` : link.score}</dd>
        </div>
        {hidden && (
          <div>
            <dt>Состояние</dt>
            <dd>
              <Badge tone="warning" icon="visibility_off">
                Скрыта
              </Badge>
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}

function changeRows(revision: SubjectLinkRevision, link: SubjectLink): DiffRow[] {
  return [
    {
      key: 'category',
      label: 'Категория',
      before: CATEGORIES[link.category].label,
      after: CATEGORIES[revision.category].label,
      changed: link.category !== revision.category,
    },
    {
      key: 'title',
      label: 'Название',
      before: link.title ?? '—',
      after: revision.title ?? '—',
      changed: (link.title ?? '') !== (revision.title ?? ''),
    },
    {
      key: 'url',
      label: 'Адрес',
      before: link.url,
      after: revision.url,
      changed: link.url !== revision.url,
    },
    {
      key: 'visibility',
      label: 'Кто видит',
      before: visibilityLabel(link.visibility, link.audienceLabel),
      after: revisionVisibility(revision, link),
      changed: link.visibility !== revision.visibility || link.flowId !== revision.flowId,
    },
  ];
}

/**
 * `link` is what other students see now: the previous approved version while an
 * edit waits, or the revision itself before the first approval.
 */
export function ChangesSection({ target }: { target: SubjectLinkTarget }) {
  const rows = changeRows(target.revision, target.link);
  if (!rows.some((row) => row.changed)) {
    if (target.link.status !== 'PENDING') return null;
    return (
      <p className={styles.note}>
        <Icon name="new_releases" size={18} />
        Новая ссылка, одобренных версий ещё нет
      </p>
    );
  }
  return (
    <section className={styles.section} aria-labelledby="case-changes">
      <h3 id="case-changes" className={styles.sectionTitle}>
        Изменения
      </h3>
      <DiffView
        caption="Изменения относительно одобренной версии"
        rows={rows}
        beforeLabel="Одобрено"
        afterLabel={target.revision.status === 'PENDING' ? 'На проверке' : 'В заявке'}
      />
    </section>
  );
}

function groupLine(groups: SubjectLinkTarget['author']['groups']): string | null {
  const group = groups[0];
  if (!group) return null;
  return [group.name, group.course > 0 ? `${group.course} курс` : null, group.facultyShortName]
    .filter(Boolean)
    .join(' · ');
}

export function RestrictionLine({ restriction }: { restriction: UserRestriction }) {
  return (
    <li className={styles.restriction}>
      <Icon name="block" size={18} />
      <span>
        <strong>{CAPABILITIES[restriction.capability]}</strong>
        {' · '}
        {restriction.expiresAt ? `до ${formatDate(restriction.expiresAt)}` : 'бессрочно'}
        {restriction.reason && <span className={styles.muted}> — {restriction.reason}</span>}
      </span>
    </li>
  );
}

export function AuthorSection({
  target,
  canOpenProfile,
}: {
  target: SubjectLinkTarget;
  canOpenProfile: boolean;
}) {
  const { author, submitterHistory: history } = target;
  const group = groupLine(author.groups);
  return (
    <section className={styles.section} aria-labelledby="case-author">
      <h3 id="case-author" className={styles.sectionTitle}>
        Автор
      </h3>
      <div className={styles.author}>
        <Avatar name={author.name} src={author.pictureUrl} size={56} decorative />
        <div className={styles.authorText}>
          <span className={styles.authorName}>{author.name}</span>
          <span className={styles.muted}>
            ИСУ {author.isu}
            {group && ` · ${group}`}
          </span>
        </div>
        {canOpenProfile && (
          <Link
            to={`/admin/users/${author.isu}`}
            className={buttonClasses({ variant: 'text', size: 'small' })}
          >
            Профиль
          </Link>
        )}
      </div>
      <dl className={styles.history}>
        <div>
          <dt>Одобрено</dt>
          <dd>{history.approved}</dd>
        </div>
        <div>
          <dt>Отклонено</dt>
          <dd>{history.rejected}</dd>
        </div>
        <div>
          <dt>Жалобы отклонены</dt>
          <dd>{history.dismissedReports}</dd>
        </div>
      </dl>
      {history.activeRestrictions.length > 0 && (
        <ul className={styles.restrictions} aria-label="Действующие ограничения">
          {history.activeRestrictions.map((restriction) => (
            <RestrictionLine key={restriction.id} restriction={restriction} />
          ))}
        </ul>
      )}
    </section>
  );
}

export function ReportsSection({ reports }: { reports: readonly ModerationReport[] }) {
  return (
    <section className={styles.section} aria-labelledby="case-reports">
      <h3 id="case-reports" className={styles.sectionTitle}>
        Жалобы <span className={styles.count}>{reports.length}</span>
      </h3>
      {reports.length === 0 ? (
        <p className={styles.muted}>Жалоб нет</p>
      ) : (
        <ul className={styles.reports}>
          {reports.map((report, index) => (
            <li key={`${report.createdAt}-${index}`} className={styles.report}>
              <div className={styles.reportHead}>
                <Badge tone="warning" icon="flag">
                  {REPORT_REASONS[report.reason]}
                </Badge>
                <span className={styles.muted}>{formatRelative(report.createdAt)}</span>
              </div>
              {report.comment && <p className={styles.reportComment}>{report.comment}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function restrictionText(decision: ModerationDecision): string | null {
  const restriction = decision.restriction;
  if (!restriction) return null;
  const term = restriction.days ? `на ${restriction.days} дн.` : 'бессрочно';
  return `${CAPABILITIES[restriction.capability]}, ${term}`;
}

export function DecisionsTimeline({ decisions }: { decisions: readonly ModerationDecision[] }) {
  return (
    <section className={styles.section} aria-labelledby="case-decisions">
      <h3 id="case-decisions" className={styles.sectionTitle}>
        Решения
      </h3>
      {decisions.length === 0 ? (
        <p className={styles.muted}>Решений пока нет</p>
      ) : (
        <ol className={styles.timeline}>
          {decisions.map((decision) => {
            const action = ACTIONS[decision.action];
            const restriction = restrictionText(decision);
            return (
              <li key={decision.id} className={styles.event}>
                <span className={styles.eventDot}>
                  <Icon name={action.icon} size={18} />
                </span>
                <div className={styles.eventBody}>
                  <span className={styles.eventTitle}>{action.label}</span>
                  <span className={styles.muted}>
                    {decision.actor === 'POLICY' ? 'Автоматически' : 'Модератор'} ·{' '}
                    {formatDateTime(decision.createdAt)}
                  </span>
                  {restriction && <span>{restriction}</span>}
                  {decision.note && <p className={styles.eventNote}>{decision.note}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
