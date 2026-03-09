export const API_URL = "http://3.25.176.21:80";

export async function fetchAPI(url: string, options?: RequestInit) {
    const res = await fetch(`${API_URL}${url}`, {
        headers: {
            "Content-Type": "application/json"
        },
        ...options
    });

    if (!res.ok) {
        throw new Error("API request failed");
    }

    return res.json();
}