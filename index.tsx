import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ResetPassword from './src/components/auth/ResetPassword';
import './src/index.css';
import './src/animations.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Page publique de réinitialisation : /reset-password?token=...
const isResetPasswordPage =
  window.location.pathname.replace(/\/+$/, '') === '/reset-password';

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    {isResetPasswordPage ? <ResetPassword /> : <App />}
  </React.StrictMode>
);
