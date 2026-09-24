import { Button } from './Button';
import { EmptyState } from './EmptyState';

export interface ErrorStateProps {
  title: string;
  description?: string;
  onRetry?: () => void;
  retrying?: boolean;
  compact?: boolean;
  className?: string;
}

/** A failed load with «Повторить». */
export function ErrorState({
  title,
  description,
  onRetry,
  retrying,
  compact,
  className,
}: ErrorStateProps) {
  return (
    <EmptyState
      icon="cloud_off"
      title={title}
      description={description}
      compact={compact}
      className={className}
      action={
        onRetry && (
          <Button variant="tonal" icon="refresh" loading={retrying} onClick={onRetry}>
            Повторить
          </Button>
        )
      }
    />
  );
}
