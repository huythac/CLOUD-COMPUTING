import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from './Layout';
import ContactsPage from '../pages/ContactsPage';
import SendPage from '../pages/SendPage';
import LogsPage from '../pages/LogsPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import ProtectedRoute from '../components/ProtectedRoute';

export const router = createBrowserRouter([
  // Public routes
  { path: '/login',          element: <LoginPage /> },
  { path: '/register',       element: <RegisterPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },

  // Protected routes
  {
    path: '/',
    element: <ProtectedRoute><Layout /></ProtectedRoute>,
    children: [
      { index: true,    element: <ContactsPage /> },
      { path: 'send',   element: <SendPage />     },
      { path: 'logs',   element: <LogsPage />     },
    ],
  },

  // Catch-all
  { path: '*', element: <Navigate to="/" replace /> },
]);
