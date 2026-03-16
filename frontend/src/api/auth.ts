import { fetchAPI } from "./api";

// 1. Hàm Đăng ký
export function register(data: any) {
  return fetchAPI("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

// 2. Hàm Đăng nhập
export function login(data: any) {
  return fetchAPI("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

// 3. Hàm Quên mật khẩu
export function forgotPassword(email: string) {
  return fetchAPI("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email })
  });
}

// 4. Hàm Đặt lại mật khẩu (nhận vào token và password mới)
export function resetPassword(data: any) {
  return fetchAPI("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(data)
  });
}