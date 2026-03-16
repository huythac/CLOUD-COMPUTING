import { fetchAPI } from "./api";

export function getUsers() {
  return fetchAPI("/users");
}

export function createUser(data: any) {
  return fetchAPI("/users", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export function updateUser(id: number, data: any) {
  return fetchAPI(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
}

export function deleteUser(id: number) {
  return fetchAPI(`/users/${id}`, {
    method: "DELETE"
  });
}
