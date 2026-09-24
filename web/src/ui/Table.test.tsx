import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Table, type TableColumn } from './Table';

interface Row {
  isu: number;
  name: string;
}

const columns: TableColumn<Row>[] = [
  { key: 'isu', header: 'ИСУ', render: (row) => row.isu, align: 'end' },
  { key: 'name', header: 'Имя', render: (row) => row.name },
];

describe('Table', () => {
  it('shows the empty state in one full-width cell', () => {
    render(
      <Table
        caption="Пользователи"
        columns={columns}
        rows={[]}
        rowKey={(row) => String(row.isu)}
        empty={{ title: 'Никого не нашли', description: 'Измените запрос.' }}
      />,
    );

    const table = screen.getByRole('table', { name: 'Пользователи' });
    const cell = within(table).getByText('Никого не нашли').closest('td');
    expect(cell).toHaveAttribute('colspan', '2');
    expect(within(table).getByText('Измените запрос.')).toBeInTheDocument();
    expect(within(table).getAllByRole('columnheader')).toHaveLength(2);
  });

  it('renders rows and selects one with the keyboard', async () => {
    const onRowClick = vi.fn();
    render(
      <Table
        caption="Пользователи"
        columns={columns}
        rows={[
          { isu: 1, name: 'Анна' },
          { isu: 2, name: 'Борис' },
        ]}
        rowKey={(row) => String(row.isu)}
        onRowClick={onRowClick}
        selectedKey="1"
      />,
    );

    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(3);
    expect(rows[1]).toHaveAttribute('aria-selected', 'true');

    rows[2]?.focus();
    await userEvent.keyboard('{Enter}');

    expect(onRowClick).toHaveBeenCalledWith({ isu: 2, name: 'Борис' });
  });

  it('shows no empty state while loading', () => {
    render(
      <Table
        caption="Пользователи"
        columns={columns}
        rows={[]}
        rowKey={(row) => String(row.isu)}
        loading
      />,
    );

    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByText('Пусто')).not.toBeInTheDocument();
  });
});
