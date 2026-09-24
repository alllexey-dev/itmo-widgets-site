import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router';
import { AppProviders } from '../app/AppProviders';
import { createQueryClient } from '../app/queryClient';
import { AppRoutes } from '../app/routes';

export function renderWithProviders(ui: ReactElement, { route = '/' } = {}) {
  const client = createQueryClient();
  return render(
    <AppProviders client={client}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </AppProviders>,
  );
}

export function renderApp(route = '/') {
  return renderWithProviders(<AppRoutes />, { route });
}
