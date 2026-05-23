import { getErrorMessage } from "./auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const parseJson = async (response) => {
  return response.json().catch(() => ({}));
};

export const submitRestaurantRequest = async (payload) => {
  const response = await fetch(`${API_URL}/api/public/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data));
  }

  return data;
};
