import { Card, EmptyState, PageHeader } from '../ui';
import { navItemByPath } from './navigation';

/** A section that is not built yet. */
export function PlaceholderPage({ path }: { path: string }) {
  const item = navItemByPath(path);
  return (
    <>
      <PageHeader title={item?.label ?? 'Раздел'} />
      <Card>
        <EmptyState icon={item?.icon ?? 'construction'} title="Раздел в разработке" />
      </Card>
    </>
  );
}
