import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('calls onClick and defaults to type button', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Сохранить</Button>);

    const button = screen.getByRole('button', { name: 'Сохранить' });
    await userEvent.click(button);

    expect(onClick).toHaveBeenCalledOnce();
    expect(button).toHaveAttribute('type', 'button');
  });

  it('applies the variant and size classes', () => {
    render(
      <Button variant="tonal" size="small">
        Ещё
      </Button>,
    );

    expect(screen.getByRole('button', { name: 'Ещё' })).toHaveClass('tonal', 'small');
  });

  it('is busy and ignores clicks while loading', async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Сохранить
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Сохранить' });
    await userEvent.click(button);

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(onClick).not.toHaveBeenCalled();
  });
});
