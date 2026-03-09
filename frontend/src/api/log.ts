import { fetchAPI } from "./api";

export function getLogs(customerId?: number) {
  if (customerId) {
    return fetchAPI(`/logs?customerId=${customerId}`);
  }
  return fetchAPI("/logs");
}

export function createLog(data: any) {
  return fetchAPI("/logs", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export function updateLog(id: number, status: string) {
  return fetchAPI(`/logs/${id}`, {
    method: "PUT",
    body: JSON.stringify({ status })
  });
}

export function deleteLog(id: number) {
  return fetchAPI(`/logs/${id}`, {
    method: "DELETE"
  });
}