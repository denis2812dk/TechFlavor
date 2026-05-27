const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const fetchAPI = async (url, options = {}) => {
  const fullUrl = url.startsWith("http") ? url : `${API_URL}${url}`;
  const response = await fetch(fullUrl, {
    ...options,
    credentials: options.credentials || "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = null;
  }

  if (!response.ok) throw new Error((data && (data.message || data.error)) || "Error en la petición");
  return data;
};

export const listPurchaseOrders = () => fetchAPI("/api/tenant/purchases");

export const createPurchaseOrder = (payload) =>
  fetchAPI("/api/tenant/purchases", { method: "POST", body: JSON.stringify(payload) });

export const receivePurchaseOrder = (orderId) =>
  fetchAPI(`/api/tenant/purchases/${orderId}/receive`, { method: "PATCH" });

export const cancelPurchaseOrder = (orderId) =>
  fetchAPI(`/api/tenant/purchases/${orderId}/cancel`, { method: "PATCH" });