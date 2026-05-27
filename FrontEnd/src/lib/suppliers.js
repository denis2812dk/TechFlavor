const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Funciones auxiliares para peticiones HTTP (usa API_URL y envía cookies)
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

export const listSuppliers = () => fetchAPI("/api/tenant/suppliers");

export const createSupplier = (payload) =>
  fetchAPI("/api/tenant/suppliers", { method: "POST", body: JSON.stringify(payload) });

export const updateSupplier = (supplierId, payload) =>
  fetchAPI(`/api/tenant/suppliers/${supplierId}`, { method: "PATCH", body: JSON.stringify(payload) });

export const deleteSupplier = (supplierId) =>
  fetchAPI(`/api/tenant/suppliers/${supplierId}`, { method: "DELETE" });

export const setSupplierCatalog = (supplierId, payload) =>
  fetchAPI(`/api/tenant/suppliers/${supplierId}/catalog`, { method: "PUT", body: JSON.stringify(payload) });

export const listIncidences = (supplierId) =>
  fetchAPI(`/api/tenant/suppliers/${supplierId}/incidences`);

export const addIncidence = (supplierId, payload) =>
  fetchAPI(`/api/tenant/suppliers/${supplierId}/incidences`, { method: "POST", body: JSON.stringify(payload) });

export const resolveSupplierIncidence = (supplierId, incidenceId, payload) =>
  fetchAPI(`/api/tenant/suppliers/${supplierId}/incidences/${incidenceId}/resolve`, { method: "PATCH", body: JSON.stringify(payload) });