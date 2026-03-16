import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute() {
    // Lấy trạng thái đăng nhập từ AuthContext
    const { isAuthenticated } = useAuth();

    // Nếu chưa đăng nhập, tự động chuyển hướng (Redirect) về trang /login
    // Tham số replace={true} giúp xóa lịch sử trang hiện tại, để user ấn nút Back không bị quay lại trang cấm
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Nếu đã đăng nhập, cho phép hiển thị các component con bên trong (chính là Layout của bạn)
    return <Outlet />;
}