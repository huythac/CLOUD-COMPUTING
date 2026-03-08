const API = "http://localhost:3000/api/customers";

export async function getCustomers() {
    const res = await fetch(API + "?userId=1");
    return res.json();
}

export async function createCustomer(data: any) {
    const res = await fetch(API, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            ...data,
            user_id: 1
        }),
    });

    return res.json();
}

export async function updateCustomer(id: string, data: any) {
    await fetch(`${API}/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
}

export async function deleteCustomer(id: string) {
    await fetch(`${API}/${id}`, {
        method: "DELETE",
    });
}