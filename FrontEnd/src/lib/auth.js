const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const parseJson = async (response) => {
  return response.json().catch(() => ({}));
};

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

export const getErrorMessage = (error) => {
  if (Array.isArray(error?.errors) && error.errors.length > 0) {
    return error.errors.map((item) => {
      const campo = item.path ? item.path.join(".") : (item.campo || "Campo");
      const msj = item.message || item.mensaje || "Dato inválido";
      return `${campo}: ${msj}`;
    }).join("\n");
  }
  if (error?.message) return error.message;
  if (error?.error?.message) return error.error.message;
  if (typeof error === "string") return error;
  
  return "Ocurrió un error inesperado.";
};
export const signInWithEmail = async ({ email, password }) => {
  const response = await fetch(`${API_URL}/api/auth/sign-in/email`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data));
  }

  return data;
};

export const getSession = async () => {
  const response = await fetch(`${API_URL}/api/auth/get-session`, {
    credentials: "include",
  });

  if (!response.ok) return null;
  return parseJson(response);
};

export const signOut = async () => {
  await fetch(`${API_URL}/api/auth/sign-out`, {
    method: "POST",
    credentials: "include",
  });
};

export const createTenantUser = async (payload) => {
  const response = await fetch(`${API_URL}/api/tenant/users`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data));
  }

  return data;
};

export const listTenantUsers = async () => {
  const response = await fetch(`${API_URL}/api/tenant/users`, {
    credentials: "include",
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data));
  }

  return data;
};

export const getMenuCatalog = async ({ includeInactive = false } = {}) => {
  const params = new URLSearchParams();
  if (includeInactive) params.set("includeInactive", "true");

  const response = await fetch(`${API_URL}/api/tenant/menu?${params.toString()}`, {
    credentials: "include",
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data));
  }

  return data;
};

export const createMenuCategory = async (payload) => {
  const response = await fetch(`${API_URL}/api/tenant/menu/categories`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(getErrorMessage(data));
  return data;
};

export const updateMenuCategory = async (categoryId, payload) => {
  const response = await fetch(`${API_URL}/api/tenant/menu/categories/${categoryId}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(getErrorMessage(data));
  return data;
};

export const createMenuProduct = async (payload) => {
  const response = await fetch(`${API_URL}/api/tenant/menu/products`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(getErrorMessage(data));
  return data;
};

export const updateMenuProduct = async (productId, payload) => {
  const response = await fetch(`${API_URL}/api/tenant/menu/products/${productId}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(getErrorMessage(data));
  return data;
};

export const createMenuCombo = async (payload) => {
  const response = await fetch(`${API_URL}/api/tenant/menu/combos`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(getErrorMessage(data));
  return data;
};

export const updateMenuCombo = async (comboId, payload) => {
  const response = await fetch(`${API_URL}/api/tenant/menu/combos/${comboId}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(getErrorMessage(data));
  return data;
};

export const createOrder = async (payload) => {
  const body = Array.isArray(payload) ? { items: payload } : payload;
  const response = await fetch(`${API_URL}/api/tenant/orders`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(getErrorMessage(data));
  return data;
};

export const listOrders = async () => {
  const response = await fetch(`${API_URL}/api/tenant/orders`, {
    credentials: "include",
  });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(getErrorMessage(data));
  return data;
};

export const listKitchenOrders = async () => {
  const response = await fetch(`${API_URL}/api/tenant/orders/kitchen`, {
    credentials: "include",
  });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(getErrorMessage(data));
  return data;
};

export const finishKitchenOrder = async (orderId) => {
  const response = await fetch(`${API_URL}/api/tenant/orders/${orderId}/finish`, {
    method: "PATCH",
    credentials: "include",
  });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(getErrorMessage(data));
  return data;
};

export const listDispatchOrders = async () => {
  const response = await fetch(`${API_URL}/api/tenant/orders/dispatch`, {
    credentials: "include",
  });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(getErrorMessage(data));
  return data;
};

export const deliverDispatchOrder = async (orderId) => {
  const response = await fetch(`${API_URL}/api/tenant/orders/${orderId}/deliver`, {
    method: "PATCH",
    credentials: "include",
  });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(getErrorMessage(data));
  return data;
};
export const setProductRecipe = async (productId, payload) => {
  const response = await fetch(`${API_URL}/api/tenant/menu/products/${productId}/recipe`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(getErrorMessage(data));
  return data;
};

export const deleteMenuProduct = async (productId) => {
  const response = await fetch(`${API_URL}/api/tenant/menu/products/${productId}`, {
    method: "DELETE",
    credentials: "include",
  });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(getErrorMessage(data));
  return data;
};
export const listIngredients = async () => {
  const response = await fetch(`${API_URL}/api/tenant/inventory/ingredients`, {
    credentials: "include",
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data));
  }

  return data;
};

export const createIngredient = async (payload) => {
  const response = await fetch(`${API_URL}/api/tenant/inventory/ingredients`, {
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

export const updateIngredient = async (ingredientId, payload) => {
  const response = await fetch(`${API_URL}/api/tenant/inventory/ingredients/${ingredientId}`, {
    method: "PATCH",
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

export const deleteIngredient = async (ingredientId) => {
  const response = await fetch(`${API_URL}/api/tenant/inventory/ingredients/${ingredientId}`, {
    method: "DELETE",
    credentials: "include",
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data));
  }

  return data;
};

export const registerShrinkage = async (payload) => {
  const response = await fetch(`${API_URL}/api/tenant/inventory/shrinkage`, {
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

export const listInventoryMovements = async ({ type = "MERMA", limit = 25 } = {}) => {
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  if (limit) params.set("limit", String(limit));

  const response = await fetch(`${API_URL}/api/tenant/inventory/movements?${params.toString()}`, {
    credentials: "include",
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data));
  }

  return data;
};

export const updateTenantUser = async (userId, payload) => {
  const response = await fetch(`${API_URL}/api/tenant/users/${userId}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data));
  }

  return data;
};

export const deleteTenantUser = async (userId) => {
  const response = await fetch(`${API_URL}/api/tenant/users/${userId}`, {
    method: "DELETE",
    credentials: "include",
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data));
  }

  return data;
};
export const getCatalogStockStatus = () => fetchAPI("/api/tenant/inventory/catalog-status");
export const getTenantOrders = () => fetchAPI("/api/tenant/orders");
export const cancelTenantOrder = (orderId) => fetchAPI(`/api/tenant/orders/${orderId}/cancel`, { method: "PATCH" });
export const editOrder = (orderId, payload) => 
    fetchAPI(`/api/tenant/orders/${orderId}`, { method: "PUT", body: JSON.stringify(payload) });