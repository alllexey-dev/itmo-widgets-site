import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { linkTarget, minutesAgo, mockModeration, moderationCase } from '../../test/admin';
import { renderApp } from '../../test/render';
import { mockSession, sessionOf } from '../../test/server';

const first = moderationCase({ id: 'case-1', title: 'Баллы по матанализу' });
const second = moderationCase({
  id: 'case-2',
  title: 'Записи лекций',
  subjectName: 'Физика',
  authorName: 'Мария Иванова',
});

function queue() {
  return screen.findByRole('list', { name: 'Заявки' });
}

function detail() {
  return screen.getByRole('region', { name: 'Заявка' });
}

async function openedCase(title: string) {
  return screen.findByRole('heading', { level: 2, name: title });
}

describe('ModerationPage', () => {
  it('lists open cases and opens the first one with the link, author and history', async () => {
    mockSession(sessionOf(['MODERATOR']));
    mockModeration([first, second]);

    renderApp('/admin/moderation');

    const list = await queue();
    expect(within(list).getAllByRole('button')).toHaveLength(2);
    expect(await openedCase('Математический анализ')).toBeInTheDocument();
    const link = within(detail()).getByRole('region', { name: 'Ссылка' });
    expect(link).toHaveTextContent('Таблица баллов');
    expect(link).toHaveTextContent('Баллы по матанализу');
    expect(link).toHaveTextContent('docs.google.com');
    expect(link).toHaveTextContent('Все');
    expect(within(link).getByRole('link', { name: /Открыть/ })).toHaveAttribute(
      'href',
      'https://docs.google.com/spreadsheets/d/case-1',
    );
    expect(detail()).toHaveTextContent('Иван Петров');
    expect(detail()).toHaveTextContent('2026/27, осень');
    expect(screen.getByRole('tab', { name: /Открытые/ })).toHaveTextContent('2');
  });

  it('filters the queue by reason', async () => {
    mockSession(sessionOf(['MODERATOR']));
    mockModeration([first, moderationCase({ id: 'case-3', title: 'Спам-чат', reason: 'REPORTS' })]);
    renderApp('/admin/moderation');
    await queue();

    await userEvent.click(screen.getByRole('button', { name: 'Жалобы' }));

    await waitFor(() =>
      expect(
        within(screen.getByRole('list', { name: 'Заявки' })).getAllByRole('button'),
      ).toHaveLength(1),
    );
    expect(screen.getByRole('list', { name: 'Заявки' })).toHaveTextContent('Спам-чат');
  });

  it('shows what changed against the approved version', async () => {
    mockSession(sessionOf(['MODERATOR']));
    const target = linkTarget({ id: 'case-1', title: 'Новые баллы' });
    target.revision.number = 2;
    target.link.title = 'Старые баллы';
    mockModeration([moderationCase({ id: 'case-1', title: 'Новые баллы' }, {}, target)]);

    renderApp('/admin/moderation');

    const diff = await screen.findByRole('table', {
      name: 'Изменения относительно одобренной версии',
    });
    const titleRow = within(diff).getByRole('row', { name: /Название/ });
    expect(titleRow).toHaveTextContent('Старые баллы');
    expect(titleRow).toHaveTextContent('Новые баллы');
    expect(titleRow).toHaveTextContent('изменено');
    expect(within(diff).getByRole('row', { name: /Адрес/ })).not.toHaveTextContent('изменено');
  });

  it('shows reports and past decisions', async () => {
    mockSession(sessionOf(['MODERATOR']));
    const target = linkTarget({ id: 'case-1', title: 'Чат потока', reason: 'REPORTS' });
    target.reports = [{ reason: 'SPAM', comment: 'Реклама курсов', createdAt: minutesAgo(5) }];
    mockModeration([
      moderationCase(
        { id: 'case-1', title: 'Чат потока', reason: 'REPORTS' },
        {
          decisions: [
            {
              id: 'd1',
              moderatorId: null,
              action: 'APPROVE',
              note: null,
              restriction: null,
              createdAt: minutesAgo(600),
              actor: 'POLICY',
            },
          ],
        },
        target,
      ),
    ]);

    renderApp('/admin/moderation');

    const reports = await screen.findByRole('region', { name: /Жалобы/ });
    expect(reports).toHaveTextContent('Спам');
    expect(reports).toHaveTextContent('Реклама курсов');
    const decisions = screen.getByRole('region', { name: 'Решения' });
    expect(decisions).toHaveTextContent('Одобрено');
    expect(decisions).toHaveTextContent('Автоматически');
    expect(screen.getByRole('button', { name: 'Отклонить жалобы' })).toBeInTheDocument();
  });

  it('approves a case and moves on to the next one', async () => {
    mockSession(sessionOf(['MODERATOR']));
    const { decisions } = mockModeration([first, second]);
    renderApp('/admin/moderation');
    await openedCase('Математический анализ');

    await userEvent.click(screen.getByRole('button', { name: 'Одобрить' }));

    expect(await screen.findByText('Ссылка одобрена')).toBeInTheDocument();
    expect(decisions).toEqual([{ caseId: 'case-1', body: { action: 'APPROVE' }, csrf: '1' }]);
    expect(await openedCase('Физика')).toBeInTheDocument();
    await waitFor(() =>
      expect(
        within(screen.getByRole('list', { name: 'Заявки' })).getAllByRole('button'),
      ).toHaveLength(1),
    );
  });

  it('rejects only with a reason', async () => {
    mockSession(sessionOf(['MODERATOR']));
    const { decisions } = mockModeration([first]);
    renderApp('/admin/moderation');
    await openedCase('Математический анализ');

    await userEvent.click(screen.getByRole('button', { name: 'Отклонить' }));
    const dialog = screen.getByRole('dialog', { name: 'Отклонить ссылку' });
    const submit = within(dialog).getByRole('button', { name: 'Отклонить' });
    expect(submit).toBeDisabled();
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Причина' }), 'Нет доступа');
    await userEvent.click(submit);

    expect(await screen.findByText('Ссылка отклонена')).toBeInTheDocument();
    expect(decisions[0]?.body).toEqual({ action: 'REJECT', note: 'Нет доступа' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('restricts the author for the chosen capability and term', async () => {
    mockSession(sessionOf(['MODERATOR']));
    const { decisions } = mockModeration([first]);
    renderApp('/admin/moderation');
    await openedCase('Математический анализ');

    await userEvent.click(screen.getByRole('button', { name: 'Ограничить' }));
    const dialog = screen.getByRole('dialog', { name: 'Ограничить автора' });
    await userEvent.selectOptions(
      within(dialog).getByRole('combobox', { name: 'Что запретить' }),
      'VOTE',
    );
    await userEvent.selectOptions(
      within(dialog).getByRole('combobox', { name: 'Срок' }),
      'forever',
    );
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Причина' }), 'Накрутка');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Ограничить' }));

    expect(await screen.findByText('Автор ограничен')).toBeInTheDocument();
    expect(decisions[0]?.body).toEqual({
      action: 'RESTRICT_USER',
      note: 'Накрутка',
      restriction: { capability: 'VOTE' },
    });
  });

  it('hides everything by the author only after confirmation', async () => {
    mockSession(sessionOf(['MODERATOR']));
    const { decisions } = mockModeration([first]);
    renderApp('/admin/moderation');
    await openedCase('Математический анализ');

    await userEvent.click(screen.getByRole('button', { name: 'Скрыть всё у автора' }));
    const dialog = screen.getByRole('dialog', { name: 'Скрыть все ссылки автора?' });
    expect(decisions).toHaveLength(0);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Скрыть всё' }));

    expect(await screen.findByText('Ссылки автора скрыты')).toBeInTheDocument();
    expect(decisions[0]?.body).toEqual({ action: 'HIDE_ALL_BY_USER' });
  });

  it('moves with J and K and approves with A', async () => {
    mockSession(sessionOf(['MODERATOR']));
    const { decisions } = mockModeration([first, second]);
    renderApp('/admin/moderation');
    await openedCase('Математический анализ');

    await userEvent.keyboard('j');
    expect(await openedCase('Физика')).toBeInTheDocument();
    await userEvent.keyboard('k');
    expect(await openedCase('Математический анализ')).toBeInTheDocument();
    await userEvent.keyboard('a');

    await waitFor(() => expect(decisions).toHaveLength(1));
    expect(decisions[0]).toMatchObject({ caseId: 'case-1', body: { action: 'APPROVE' } });
  });

  it('opens the reject dialog with R and ignores keys while typing', async () => {
    mockSession(sessionOf(['MODERATOR']));
    const { decisions } = mockModeration([first, second]);
    renderApp('/admin/moderation');
    await openedCase('Математический анализ');

    await userEvent.keyboard('r');
    const reason = within(screen.getByRole('dialog', { name: 'Отклонить ссылку' })).getByRole(
      'textbox',
      { name: 'Причина' },
    );
    await userEvent.type(reason, 'ja');

    expect(reason).toHaveValue('ja');
    expect(decisions).toHaveLength(0);
    expect(
      screen.getByRole('heading', { level: 2, name: 'Математический анализ' }),
    ).toBeInTheDocument();
  });

  it('offers to restore a hidden link in a resolved case', async () => {
    mockSession(sessionOf(['MODERATOR']));
    const target = linkTarget({ id: 'case-9', title: 'Скрытая' });
    target.link.status = 'HIDDEN';
    const { decisions } = mockModeration([
      moderationCase({ id: 'case-9', title: 'Скрытая' }, { status: 'RESOLVED' }, target),
    ]);
    renderApp('/admin/moderation?status=RESOLVED');
    await openedCase('Математический анализ');

    expect(screen.queryByRole('button', { name: 'Одобрить' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Вернуть' }));

    expect(await screen.findByText('Ссылка снова видна')).toBeInTheDocument();
    expect(decisions[0]?.body).toEqual({ action: 'RESTORE' });
  });

  it('says so when the queue is empty', async () => {
    mockSession(sessionOf(['MODERATOR']));
    mockModeration([]);

    renderApp('/admin/moderation');

    expect(await screen.findByText('Очередь пуста')).toBeInTheDocument();
  });
});
