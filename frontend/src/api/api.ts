export const API_URL = "http://CC-Final-Public-ALB-1857801423.ap-southeast-2.elb.amazonaws.com";
//export const API_URL = "http://3.25.176.21:3000";
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