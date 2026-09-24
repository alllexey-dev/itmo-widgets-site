import { useRef, useState } from 'react';
import type { RestrictionCapability } from '../../api/admin';
import { Button, Chip, ConfirmDialog, Dialog, Select, Textarea } from '../../ui';
import { CAPABILITIES } from './labels';
import styles from './CaseDetail.module.css';
import type { DecisionRequest } from './types';

export const NOTE_LIMIT = 500;

const REJECT_PRESETS = [
  'Не открывается',
  'Не относится к предмету',
  'Уже есть такая ссылка',
  'Спам',
];

interface DecisionDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (request: DecisionRequest) => void;
  saving: boolean;
}

/** The reason is required: the author sees it in the app. */
export function RejectDialog({ open, onClose, onSubmit, saving }: DecisionDialogProps) {
  const [note, setNote] = useState('');
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const trimmed = note.trim();
  const valid = trimmed.length > 0 && trimmed.length <= NOTE_LIMIT;
  const submit = () => {
    if (valid) onSubmit({ action: 'REJECT', note: trimmed });
  };
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Отклонить ссылку"
      description="Автор увидит причину в приложении."
      dismissible={!saving}
      initialFocusRef={noteRef}
      size="medium"
      actions={
        <>
          <Button variant="text" onClick={onClose} disabled={saving}>
            Отмена
          </Button>
          <Button danger loading={saving} disabled={!valid} onClick={submit}>
            Отклонить
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        <div className={styles.presets} role="group" aria-label="Частые причины">
          {REJECT_PRESETS.map((preset) => (
            <Chip key={preset} selected={trimmed === preset} onClick={() => setNote(preset)}>
              {preset}
            </Chip>
          ))}
        </div>
        <Textarea
          ref={noteRef}
          label="Причина"
          value={note}
          maxLength={NOTE_LIMIT}
          onChange={(event) => setNote(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) submit();
          }}
        />
      </div>
    </Dialog>
  );
}

const CAPABILITY_OPTIONS = (Object.keys(CAPABILITIES) as RestrictionCapability[]).map((value) => ({
  value,
  label: CAPABILITIES[value],
}));

const TERM_OPTIONS = [
  { value: '1', label: '1 день' },
  { value: '3', label: '3 дня' },
  { value: '7', label: '7 дней' },
  { value: '30', label: '30 дней' },
  { value: '90', label: '90 дней' },
  { value: 'forever', label: 'Бессрочно' },
] as const;

type Term = (typeof TERM_OPTIONS)[number]['value'];

export function RestrictDialog({
  open,
  onClose,
  onSubmit,
  saving,
  authorName,
}: DecisionDialogProps & { authorName: string }) {
  const [capability, setCapability] = useState<RestrictionCapability>('SUBMIT_RESOURCES');
  const [term, setTerm] = useState<Term>('7');
  const [note, setNote] = useState('');
  const trimmed = note.trim();
  const valid = trimmed.length > 0 && trimmed.length <= NOTE_LIMIT;
  const submit = () => {
    if (!valid) return;
    onSubmit({
      action: 'RESTRICT_USER',
      note: trimmed,
      restriction: term === 'forever' ? { capability } : { capability, days: Number(term) },
    });
  };
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Ограничить автора"
      description={`${authorName} не сможет выбранное действие. Заявка останется открытой.`}
      dismissible={!saving}
      size="medium"
      actions={
        <>
          <Button variant="text" onClick={onClose} disabled={saving}>
            Отмена
          </Button>
          <Button danger loading={saving} disabled={!valid} onClick={submit}>
            Ограничить
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        <div className={styles.formRow}>
          <Select
            label="Что запретить"
            options={CAPABILITY_OPTIONS}
            value={capability}
            onChange={setCapability}
          />
          <Select label="Срок" options={TERM_OPTIONS} value={term} onChange={setTerm} />
        </div>
        <Textarea
          label="Причина"
          hint="Автор увидит её в приложении"
          value={note}
          maxLength={NOTE_LIMIT}
          onChange={(event) => setNote(event.target.value)}
        />
      </div>
    </Dialog>
  );
}

export function HideAllDialog({
  open,
  onClose,
  onSubmit,
  saving,
  authorName,
}: DecisionDialogProps & { authorName: string }) {
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={() => onSubmit({ action: 'HIDE_ALL_BY_USER' })}
      title="Скрыть все ссылки автора?"
      description={`Опубликованные ссылки ${authorName} скроются, ссылки на проверке будут отклонены. Личные ссылки останутся.`}
      confirmLabel="Скрыть всё"
      danger
      loading={saving}
    />
  );
}
