export const API_URL = "CC-Final-Public-ALB-1857801423.ap-southeast-2.elb.amazonaws.com";

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