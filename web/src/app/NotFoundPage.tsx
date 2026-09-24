import { Link } from 'react-router';
import { buttonClasses, Card, EmptyState } from '../ui';

export function NotFoundPage() {
  return (
    <Card>
      <EmptyState
        icon="search_off"
        title="Страница не найдена"
        description="Проверьте адрес или вернитесь на главную."
        action={
          <Link to="/" className={buttonClasses({ variant: 'tonal' })}>
            На главную
          </Link>
        }
      />
    </Card>
  );
}
