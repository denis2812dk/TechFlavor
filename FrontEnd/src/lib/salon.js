import { getErrorMessage } from "./auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const parseJson = async (response) => {
  return response.json().catch(() => ({}));
};

export const getSalonStatus = async () => {
  const response = await fetch(`${API_URL}/api/tenant/tables/salon`, {
    credentials: "include",
  });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(getErrorMessage(data));
  return data;
};

export const createZone = async (name) => {
  const response = await fetch(`${API_URL}/api/tenant/tables/zones`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name }),
  });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(getErrorMessage(data));
  return data;
};

export const createTable = async (zoneId, identifier, capacity) => {
  const response = await fetch(`${API_URL}/api/tenant/tables`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ zoneId, identifier, capacity: Number(capacity) }),
  });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(getErrorMessage(data));
  return data;
};

export const updateTableStatus = async (tableId, status) => {
  const response = await fetch(`${API_URL}/api/tenant/tables/${tableId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status }),
  });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(getErrorMessage(data));
  return data;
};