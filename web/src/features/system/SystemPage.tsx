import { useState } from 'react';
import { errorText } from '../../api/errors';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  ConfirmDialog,
  ErrorState,
  formatDateTime,
  PageHeader,
  Skeleton,
  Switch,
  Textarea,
  TextField,
  useToast,
} from '../../ui';
import {
  useAppVersion,
  useModerationSettings,
  useSaveAppVersion,
  useSaveModerationSettings,
} from './api';
import styles from './SystemPages.module.css';
import {
  LINK_POLICY,
  type AppVersion,
  type ModerationPolicy,
  type ModerationSettings,
} from './types';
import { compareVersions, isVersion, NOTE_LIMIT } from './version';

export function SystemPage() {
  return (
    <>
      <PageHeader title="Система" description="Версия приложения и правила модерации" />
      <div className={styles.cards}>
        <AppVersionCard />
        <ModerationSettingsCard />
      </div>
    </>
  );
}

function CardSkeleton({ label }: { label: string }) {
  return (
    <div className={styles.form} role="status" aria-label={label}>
      <Skeleton height={48} />
      <Skeleton height={48} />
      <Skeleton height={96} />
    </div>
  );
}

function AppVersionCard() {
  const version = useAppVersion();
  return (
    <Card as="section" padding="large" aria-label="Версия приложения">
      <CardHeader
        title="Версия приложения"
        subtitle="Приложение предлагает обновиться до последней и требует минимальную"
      />
      {version.isPending ? (
        <CardSkeleton label="Загружаем версию" />
      ) : version.isError ? (
        <ErrorState
          compact
          title="Не удалось загрузить версию"
          description={errorText(version.error, 'Попробуйте ещё раз.')}
          onRetry={() => void version.refetch()}
          retrying={version.isFetching}
        />
      ) : (
        <AppVersionForm key={version.data.updatedAt ?? 'env'} saved={version.data} />
      )}
    </Card>
  );
}

function versionError(value: string): string | undefined {
  if (!value.trim()) return 'Укажите версию';
  if (!isVersion(value)) return 'Например, 2.3 или 2.3.1-beta';
  return undefined;
}

function AppVersionForm({ saved }: { saved: AppVersion }) {
  const toast = useToast();
  const save = useSaveAppVersion();
  const [latest, setLatest] = useState(saved.latest);
  const [minimum, setMinimum] = useState(saved.minimum);
  const [note, setNote] = useState(saved.note);

  const latestError = versionError(latest);
  const minimumError =
    versionError(minimum) ??
    (!latestError && compareVersions(minimum, latest) > 0 ? 'Не выше последней' : undefined);
  const noteError =
    note.trim().length > NOTE_LIMIT ? `Не больше ${NOTE_LIMIT} символов` : undefined;
  const dirty =
    latest.trim() !== saved.latest ||
    minimum.trim() !== saved.minimum ||
    note.trim() !== saved.note;
  const valid = !latestError && !minimumError && !noteError;

  const reset = () => {
    setLatest(saved.latest);
    setMinimum(saved.minimum);
    setNote(saved.note);
  };

  const submit = () => {
    save.mutate(
      { latest: latest.trim(), minimum: minimum.trim(), note: note.trim() },
      {
        onSuccess: () => toast.show({ message: 'Версия сохранена', tone: 'success' }),
        onError: (error) =>
          toast.show({
            message: errorText(error, 'Не удалось сохранить версию', {
              invalid_request_data: 'Проверьте версии и заметку',
            }),
            tone: 'error',
          }),
      },
    );
  };

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        if (dirty && valid) submit();
      }}
    >
      <p className={styles.source}>
        <Badge tone={saved.overridden ? 'info' : 'neutral'}>
          {saved.overridden ? 'Из настроек' : 'По умолчанию сервера'}
        </Badge>
        {saved.updatedAt && <span>изменено {formatDateTime(saved.updatedAt)}</span>}
      </p>
      <div className={styles.formRow}>
        <TextField
          label="Последняя"
          value={latest}
          onChange={(event) => setLatest(event.target.value)}
          error={latestError}
          autoComplete="off"
        />
        <TextField
          label="Минимальная"
          value={minimum}
          onChange={(event) => setMinimum(event.target.value)}
          error={minimumError}
          autoComplete="off"
        />
      </div>
      <Textarea
        label="Заметка к обновлению"
        hint="Видна в приложении рядом с предложением обновиться"
        value={note}
        maxLength={NOTE_LIMIT}
        error={noteError}
        onChange={(event) => setNote(event.target.value)}
      />
      <div className={styles.formActions}>
        {dirty && (
          <Button variant="text" onClick={reset} disabled={save.isPending}>
            Отменить
          </Button>
        )}
        <Button type="submit" loading={save.isPending} disabled={!dirty || !valid}>
          Сохранить
        </Button>
      </div>
    </form>
  );
}

function ModerationSettingsCard() {
  const settings = useModerationSettings();
  const policy = settings.data?.policies[LINK_POLICY];
  return (
    <Card as="section" padding="large" aria-label="Модерация ссылок">
      <CardHeader title="Модерация ссылок" subtitle="Премодерация и пороги для ссылок предметов" />
      {settings.isPending ? (
        <CardSkeleton label="Загружаем правила модерации" />
      ) : settings.isError || !policy ? (
        <ErrorState
          compact
          title="Не удалось загрузить правила"
          description={errorText(settings.error, 'Попробуйте ещё раз.')}
          onRetry={() => void settings.refetch()}
          retrying={settings.isFetching}
        />
      ) : (
        <ModerationSettingsForm
          key={JSON.stringify(policy)}
          settings={settings.data}
          saved={policy}
        />
      )}
    </Card>
  );
}

interface LimitField {
  key: Exclude<keyof ModerationPolicy, 'premoderation'>;
  label: string;
  hint: string;
  valid: (value: number) => boolean;
  error: string;
}

const LIMITS: LimitField[] = [
  {
    key: 'reportThreshold',
    label: 'Жалоб до проверки',
    hint: 'Разных авторов жалоб',
    valid: (value) => value >= 1,
    error: 'Не меньше 1',
  },
  {
    key: 'voteThreshold',
    label: 'Рейтинг для проверки',
    hint: 'Отрицательное число',
    valid: (value) => value <= -1,
    error: 'Не больше −1',
  },
  {
    key: 'dailySubmissionLimit',
    label: 'Ссылок в сутки',
    hint: 'На одного автора',
    valid: (value) => value >= 1,
    error: 'Не меньше 1',
  },
  {
    key: 'dailyReportLimit',
    label: 'Жалоб в сутки',
    hint: 'От одного человека',
    valid: (value) => value >= 1,
    error: 'Не меньше 1',
  },
];

function ModerationSettingsForm({
  settings,
  saved,
}: {
  settings: ModerationSettings;
  saved: ModerationPolicy;
}) {
  const toast = useToast();
  const save = useSaveModerationSettings();
  const [premoderation, setPremoderation] = useState(saved.premoderation);
  const [limits, setLimits] = useState(() =>
    Object.fromEntries(LIMITS.map(({ key }) => [key, String(saved[key])])),
  );
  const [confirming, setConfirming] = useState(false);

  const errors = Object.fromEntries(
    LIMITS.map((field) => {
      const text = limits[field.key] ?? '';
      const value = Number(text);
      const ok = /^-?\d+$/.test(text.trim()) && field.valid(value);
      return [field.key, ok ? undefined : field.error];
    }),
  );
  const valid = Object.values(errors).every((error) => error === undefined);
  const next: ModerationPolicy = {
    premoderation,
    reportThreshold: Number(limits.reportThreshold),
    voteThreshold: Number(limits.voteThreshold),
    dailySubmissionLimit: Number(limits.dailySubmissionLimit),
    dailyReportLimit: Number(limits.dailyReportLimit),
  };
  const dirty =
    premoderation !== saved.premoderation || LIMITS.some(({ key }) => next[key] !== saved[key]);

  const submit = () => {
    save.mutate(
      { policies: { ...settings.policies, [LINK_POLICY]: next } },
      {
        onSuccess: () => {
          setConfirming(false);
          toast.show({ message: 'Правила сохранены', tone: 'success' });
        },
        onError: (error) =>
          toast.show({
            message: errorText(error, 'Не удалось сохранить правила', {
              invalid_request_data: 'Проверьте пороги',
            }),
            tone: 'error',
          }),
      },
    );
  };

  const requestSave = () => {
    if (!dirty || !valid) return;
    if (saved.premoderation && !premoderation) setConfirming(true);
    else submit();
  };

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        requestSave();
      }}
    >
      <Switch
        label="Премодерация"
        description="Ссылки для всех видны только после проверки"
        checked={premoderation}
        onChange={setPremoderation}
      />
      <hr className={styles.divider} />
      <div className={styles.limits}>
        {LIMITS.map((field) => (
          <TextField
            key={field.key}
            label={field.label}
            hint={field.hint}
            inputMode="numeric"
            value={limits[field.key] ?? ''}
            error={errors[field.key]}
            onChange={(event) =>
              setLimits((current) => ({ ...current, [field.key]: event.target.value }))
            }
          />
        ))}
      </div>
      <div className={styles.formActions}>
        <Button type="submit" loading={save.isPending && !confirming} disabled={!dirty || !valid}>
          Сохранить
        </Button>
      </div>
      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={submit}
        loading={save.isPending}
        title="Выключить премодерацию?"
        description="Все ссылки, которые ждут проверки, сразу станут видны."
        confirmLabel="Выключить"
        danger
      />
    </form>
  );
}
