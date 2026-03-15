export const API_URL = "http://localhost:3000";

function getToken(): string | null {
    return localStorage.getItem('auth_token');
}

export async function fetchAPI(url: string, options?: RequestInit) {
    const token = getToken();

    const res = await fetch(`${API_URL}${url}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {}),
            ...(options?.headers ?? {})
        }
    });

    if (res.status === 401) {
        // Token expired or invalid — force logout
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        window.location.href = '/login';
        throw new Error('Session expired. Please sign in again.');
    }

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'API request failed');
    }

    return res.json();
}