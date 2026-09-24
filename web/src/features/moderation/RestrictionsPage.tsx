import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { DEFAULT_PAGE_SIZE } from '../../api/admin';
import { errorText } from '../../api/errors';
import {
  Chip,
  ErrorState,
  IconButton,
  PageHeader,
  Pagination,
  TextField,
  useDebouncedValue,
} from '../../ui';
import { useRestrictions } from './api';
import { RestrictionsTable } from './RestrictionsTable';
import styles from './RestrictionsPage.module.css';

const ISU_PATTERN = /^\d{1,9}$/;

export function RestrictionsPage() {
  const [params, setParams] = useSearchParams();
  const [isuText, setIsuText] = useState(params.get('isu') ?? '');
  const debounced = useDebouncedValue(isuText.trim());
  const valid = debounced === '' || ISU_PATTERN.test(debounced);
  const active = params.get('all') !== '1';
  const page = Math.max(0, Number(params.get('page')) || 0);

  const restrictions = useRestrictions({
    isu: valid && debounced ? Number(debounced) : null,
    active,
    page,
    size: DEFAULT_PAGE_SIZE,
  });

  const update = (changes: Record<string, string | null>) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        Object.entries(changes).forEach(([key, value]) =>
          value === null ? next.delete(key) : next.set(key, value),
        );
        return next;
      },
      { replace: true },
    );

  const changeIsu = (value: string) => {
    setIsuText(value);
    update({ isu: value.trim() || null, page: null });
  };

  return (
    <>
      <PageHeader title="Ограничения" description="Кому и что запрещено после решений модерации" />
      <div className={styles.toolbar}>
        <TextField
          className={styles.search}
          label="ИСУ"
          hideLabel
          icon="search"
          placeholder="Поиск по ИСУ"
          inputMode="numeric"
          autoComplete="off"
          value={isuText}
          onChange={(event) => changeIsu(event.target.value)}
          error={valid ? undefined : 'Только цифры'}
          trailing={
            isuText && <IconButton icon="close" label="Очистить" onClick={() => changeIsu('')} />
          }
        />
        <div className={styles.filters} role="group" aria-label="Состояние">
          <Chip selected={active} onClick={() => update({ all: null, page: null })}>
            Действующие
          </Chip>
          <Chip selected={!active} onClick={() => update({ all: '1', page: null })}>
            Все
          </Chip>
        </div>
      </div>
      {restrictions.isError ? (
        <ErrorState
          title="Не удалось загрузить ограничения"
          description={errorText(restrictions.error, 'Попробуйте ещё раз.')}
          onRetry={() => void restrictions.refetch()}
          retrying={restrictions.isFetching}
        />
      ) : (
        <>
          <RestrictionsTable
            caption="Ограничения"
            rows={restrictions.data?.items ?? []}
            loading={restrictions.isPending}
            empty={
              debounced
                ? { title: 'Ничего не нашли', description: 'Проверьте номер ИСУ.' }
                : {
                    title: active ? 'Действующих ограничений нет' : 'Ограничений ещё не было',
                  }
            }
          />
          {restrictions.data && (
            <Pagination
              page={page}
              size={DEFAULT_PAGE_SIZE}
              total={restrictions.data.total}
              onChange={(next) => update({ page: next > 0 ? String(next) : null })}
            />
          )}
        </>
      )}
    </>
  );
}
