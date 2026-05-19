import { getErrorMessage } from "./auth";

const API_URL = import.meta.env.VITE_API_URL;

const parseJson = async (response) => {
  return response.json().catch(() => ({}));
};

export const listActivePromotions = async () => {
  const response = await fetch(`${API_URL}/api/tenant/promotions/active`, {
    credentials: "include",
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data));
  }

  return data;
};

export const createPromotion = async (payload) => {
  const response = await fetch(`${API_URL}/api/tenant/promotions`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data));
  }

  return data;
};