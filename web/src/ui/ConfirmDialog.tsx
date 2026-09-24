import type { ReactNode } from 'react';
import { Button } from './Button';
import { Dialog } from './Dialog';

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** Red confirm button for destructive actions. */
  danger?: boolean;
  /** Keeps the dialog open with a spinner while the action runs. */
  loading?: boolean;
  /** Extra content, e.g. a form field; the confirm button stays the main action. */
  children?: ReactNode;
  confirmDisabled?: boolean;
}

/** A yes/no question. Focus starts on «Отмена», so Enter never confirms by accident. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Отмена',
  danger = false,
  loading = false,
  children,
  confirmDisabled = false,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      dismissible={!loading}
      actions={
        <>
          <Button variant="text" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button danger={danger} loading={loading} disabled={confirmDisabled} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Dialog>
  );
}
