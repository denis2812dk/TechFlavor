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
  } catch (error) {
    data = null;
  }

  if (!response.ok) {
    throw new Error((data && (data.message || data.error)) || "Error en la petición");
  }

  return data;
};

// --- RUTAS DEL CAJERO ---
export const getMyShift = () => fetchAPI("/api/tenant/cash/my-shift");
export const openMyShift = (payload) => fetchAPI("/api/tenant/cash/my-shift/open", { method: "POST", body: JSON.stringify(payload) });
export const addMovement = (shiftId, payload) => fetchAPI(`/api/tenant/cash/my-shift/${shiftId}/movements`, { method: "POST", body: JSON.stringify(payload) });
export const getMovements = (shiftId) => fetchAPI(`/api/tenant/cash/my-shift/${shiftId}/movements`);
export const closeMyShift = (shiftId, payload) => fetchAPI(`/api/tenant/cash/my-shift/${shiftId}/close`, { method: "POST", body: JSON.stringify(payload) });

// --- RUTAS DEL GERENTE ---
export const getShiftHistory = () => fetchAPI("/api/tenant/cash/history");
export const getShiftDetails = (shiftId) => fetchAPI(`/api/tenant/cash/history/${shiftId}`);