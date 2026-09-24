import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { Button } from './Button';
import { Dialog } from './Dialog';

function DialogHarness({ dismissible = true }: { dismissible?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Открыть</Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Отклонить ссылку"
        description="Автор увидит причину."
        dismissible={dismissible}
        actions={
          <>
            <Button variant="text" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button>Отклонить</Button>
          </>
        }
      />
    </>
  );
}

describe('Dialog', () => {
  it('is a labelled modal that focuses its first action', async () => {
    render(<DialogHarness />);

    await userEvent.click(screen.getByRole('button', { name: 'Открыть' }));

    const dialog = screen.getByRole('dialog', { name: 'Отклонить ссылку' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleDescription('Автор увидит причину.');
    expect(screen.getByRole('button', { name: 'Отмена' })).toHaveFocus();
  });

  it('keeps Tab and Shift+Tab inside the dialog', async () => {
    render(<DialogHarness />);
    await userEvent.click(screen.getByRole('button', { name: 'Открыть' }));

    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Отклонить' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Закрыть' })).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Отклонить' })).toHaveFocus();
  });

  it('closes on Esc and returns focus to the opener', async () => {
    render(<DialogHarness />);
    const opener = screen.getByRole('button', { name: 'Открыть' });
    await userEvent.click(opener);

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it('ignores Esc when it is not dismissible', async () => {
    render(<DialogHarness dismissible={false} />);
    await userEvent.click(screen.getByRole('button', { name: 'Открыть' }));

    await userEvent.keyboard('{Escape}');

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
