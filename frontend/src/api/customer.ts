import { fetchAPI } from "./api";

export function getCustomers(userId: number) {
    return fetchAPI(`/customers?userId=${userId}`);
}

export function createCustomer(data: any) {
    return fetchAPI("/customers", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });
}

export function updateCustomer(id: number, data: any) {
    return fetchAPI(`/customers/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });
}

export function deleteCustomer(id: number) {
    return fetchAPI(`/customers/${id}`, {
        method: "DELETE"
    });
}