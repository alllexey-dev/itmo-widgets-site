import { useState } from 'react';
import { BrowserRouter } from 'react-router';
import { AppProviders } from './AppProviders';
import { createQueryClient } from './queryClient';
import { AppRoutes } from './routes';

/** `/app/` from `vite.config.ts` without the trailing slash. */
const BASENAME = import.meta.env.BASE_URL.replace(/\/$/, '');

export function App() {
  const [client] = useState(createQueryClient);
  return (
    <AppProviders client={client}>
      <BrowserRouter basename={BASENAME}>
        <AppRoutes />
      </BrowserRouter>
    </AppProviders>
  );
}
