import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { login as apiLogin, register as apiRegister } from '../api/auth';
// Định nghĩa kiểu dữ liệu cho User (bạn có thể thêm các trường khác nếu cần)
interface User {
    id: number;
    username: string;
    email: string;
}

// Định nghĩa những gì Context này sẽ cung cấp ra ngoài
interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (data: any) => Promise<any>;
    register: (data: any) => Promise<any>;
    logout: () => void;
}

// Tạo Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider để bọc toàn bộ App
export function AuthProvider({ children }: { children: ReactNode }) {
    // Khởi tạo state từ localStorage (để F5 không bị mất đăng nhập)
    const [user, setUser] = useState<User | null>(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const [token, setToken] = useState<string | null>(() => {
        return localStorage.getItem('token') || null;
    });

    // Hàm xử lý Đăng nhập
    const login = async (data: any) => {
        const response = await apiLogin(data);

        // Giả sử backend trả về { success: true, token: "...", user: {...} }
        if (response.success && response.token) {
            setToken(response.token);
            setUser(response.user);

            // Lưu vào localStorage
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
        } else if (!response.success) {
            // Ném lỗi ra để LoginPage bắt được và hiển thị
            throw new Error(response.message || "Đăng nhập thất bại");
        }

        return response;
    };

    // Hàm xử lý Đăng ký
    const register = async (data: any) => {
        const response = await apiRegister(data);

        if (!response.success) {
            throw new Error(response.message || "Đăng ký thất bại");
        }

        return response;
    };

    // Hàm Đăng xuất
    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated: !!user, // Nếu có user thì là true
                login,
                register,
                logout
            }
            }
        >
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook để sử dụng Context dễ dàng hơn
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}