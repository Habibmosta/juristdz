import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ResetPassword from './src/components/auth/ResetPassword';
import VerifyEmail from './src/components/auth/VerifyEmail';
import './src/index.css';
import './src/animations.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Pages publiques : /reset-password?token=... et /verify-email?token=...
const pathname = window.location.pathname.replace(/\/+$/, '');
const isResetPasswordPage = pathname === '/reset-password';
const isVerifyEmailPage = pathname === '/verify-email';

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    {isResetPasswordPage ? <ResetPassword /> : isVerifyEmailPage ? <VerifyEmail /> : <App />}
  </React.StrictMode>
);
