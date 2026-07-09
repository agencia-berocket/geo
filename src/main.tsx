import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import './index.css';

// Route: /admin → AdminApp, everything else → public site App
const isAdminRoute = window.location.pathname.startsWith('/admin');

if (isAdminRoute) {
  import('./admin/AdminApp').then(({ default: AdminApp }) => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <AdminApp />
      </StrictMode>
    );
  });
} else {
  import('./App').then(({ default: App }) => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  });
}
