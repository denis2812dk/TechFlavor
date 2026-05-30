import { getErrorMessage } from "./auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const parseJson = async (response) => response.json().catch(() => ({}));

export const getPendingRequests = async () => {
  const response = await fetch(`${API_URL}/api/saas/requests`, {
    credentials: "include",
  });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(getErrorMessage(data));
  return data;
};

export const approveRequest = async (requestId) => {
  const response = await fetch(`${API_URL}/api/saas/requests/${requestId}/approve`, {
    method: "POST",
    credentials: "include",
  });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(getErrorMessage(data));
  return data;
};

export const rejectRequest = async (requestId, reason = "") => {
  const response = await fetch(`${API_URL}/api/saas/requests/${requestId}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ reason }),
  });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(getErrorMessage(data));
  return data;
};
export const getRegisteredRestaurants = async () => {
  const response = await fetch(`${API_URL}/api/saas/restaurants`, {
    credentials: "include",
  });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(getErrorMessage(data));
  return data;
};
export const getSaaSStatistics = async () => {
  const response = await fetch(`${API_URL}/api/saas/statistics`, {
    credentials: "include",
  });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(getErrorMessage(data));
  return data;
};

export const toggleRestaurantStatus = async (restaurantId) => {
  const response = await fetch(`${API_URL}/api/saas/restaurants/${restaurantId}/toggle-status`, {
    method: "PATCH",
    credentials: "include",
  });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(getErrorMessage(data));
  return data;
};