import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import './index.css';
import { router } from './app/routes';
import { AuthProvider } from './contexts/AuthContext'; // Thêm dòng import này

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Bọc AuthProvider ra ngoài RouterProvider */}
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
);