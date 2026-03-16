import { createBrowserRouter } from 'react-router-dom';
import Layout from './Layout';
import ContactsPage from '../pages/ContactsPage';
import SendPage from '../pages/SendPage';
import LogsPage from '../pages/LogsPage';

// Import 4 trang Auth
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';

// Thêm Import file ProtectedRoute bạn vừa tạo
// (Lưu ý chỉnh lại đường dẫn '../components/ProtectedRoute' cho khớp với nơi bạn lưu file nhé)
import ProtectedRoute from '../app/ProtectedRoute';

export const router = createBrowserRouter([
  // 1. CÁC TRANG PUBLIC (Không cần đăng nhập vẫn xem được)
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },

  // 2. CÁC TRANG PROTECTED (Bắt buộc đăng nhập)
  {
    element: <ProtectedRoute />, // Đặt lính gác ở đây
    children: [
      {
        path: '/',
        element: <Layout />, // Nếu qua được lính gác, mới cho hiển thị Layout
        children: [
          { index: true, element: <ContactsPage /> },
          { path: 'send', element: <SendPage /> },
          { path: 'logs', element: <LogsPage /> },
        ],
      },
    ],
  },
]);