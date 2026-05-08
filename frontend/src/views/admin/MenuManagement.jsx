import { useEffect, useMemo, useState } from "react";
import {
  createMenuCategory,
  createMenuCombo,
  createMenuProduct,
  getErrorMessage,
  getMenuCatalog,
  updateMenuCombo,
  updateMenuProduct,
} from "../../lib/auth";

const TABS = ["Productos", "Categorias", "Combos"];
const emptyCategory = { name: "", description: "" };
const emptyProduct = { name: "", description: "", price: "", categoryId: "" };
const emptyComboItem = { productId: "", quantity: 1 };
const emptyCombo = { name: "", description: "", price: "", items: [emptyComboItem] };

const getInitials = (value) => value
  .split(" ")
  .map((part) => part[0])
  .join("")
  .slice(0, 2)
  .toUpperCase();

export const MenuManagement = () => {
  const [activeTab, setActiveTab] = useState("Categorias");
  const [catalog, setCatalog] = useState({ categories: [], products: [], combos: [] });
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [comboForm, setComboForm] = useState(emptyCombo);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const loadCatalog = async () => {
    try {
      const data = await getMenuCatalog({ includeInactive: true });
      setCatalog(data);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCatalog();
  }, []);

  const activeProducts = useMemo(() => (
    catalog.products.filter((product) => product.isActive)
  ), [catalog.products]);

  const activeCategories = useMemo(() => (
    catalog.categories.filter((category) => category.isActive)
  ), [catalog.categories]);

  const activeCombos = useMemo(() => (
    catalog.combos.filter((combo) => combo.isActive)
  ), [catalog.combos]);

  const sectionMeta = {
    Productos: {
      title: "Productos",
      description: "Manage your menu items, pricing, and visibility",
      count: catalog.products.length,
      active: activeProducts.length,
      button: "Add Product",
    },
    Categorias: {
      title: "Categories & Combos",
      description: "Organize your menu and create special combo offers",
      count: catalog.categories.length,
      active: activeCategories.length,
      button: "Add Category",
    },
    Combos: {
      title: "Categories & Combos",
      description: "Organize your menu and create special combo offers",
      count: catalog.combos.length,
      active: activeCombos.length,
      button: "Create Combo",
    },
  };

  const currentMeta = sectionMeta[activeTab];

  const clearMessages = () => {
    setStatus("");
    setError("");
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setShowCreate(false);
    clearMessages();
  };

  const handleCreateCategory = async (event) => {
    event.preventDefault();
    clearMessages();
    try {
      await createMenuCategory(categoryForm);
      setCategoryForm(emptyCategory);
      setStatus("Categoria creada.");
      setShowCreate(false);
      await loadCatalog();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const handleCreateProduct = async (event) => {
    event.preventDefault();
    clearMessages();
    try {
      await createMenuProduct(productForm);
      setProductForm(emptyProduct);
      setStatus("Producto creado.");
      setShowCreate(false);
      await loadCatalog();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const handleCreateCombo = async (event) => {
    event.preventDefault();
    clearMessages();

    const items = comboForm.items
      .filter((item) => item.productId)
      .map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
      }));

    try {
      await createMenuCombo({
        name: comboForm.name,
        description: comboForm.description,
        price: comboForm.price,
        items,
      });
      setComboForm(emptyCombo);
      setStatus("Combo creado.");
      setShowCreate(false);
      await loadCatalog();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const updateComboItem = (index, field, value) => {
    setComboForm((form) => ({
      ...form,
      items: form.items.map((item, itemIndex) => (
        itemIndex === index ? { ...item, [field]: value } : item
      )),
    }));
  };

  const addComboItem = () => {
    setComboForm((form) => ({
      ...form,
      items: [...form.items, { ...emptyComboItem }],
    }));
  };

  const removeComboItem = (index) => {
    setComboForm((form) => ({
      ...form,
      items: form.items.length === 1
        ? [{ ...emptyComboItem }]
        : form.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const toggleProduct = async (product) => {
    clearMessages();
    try {
      await updateMenuProduct(product.id, { isActive: !product.isActive });
      setStatus(product.isActive ? "Producto oculto para caja." : "Producto visible en caja.");
      await loadCatalog();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const toggleCombo = async (combo) => {
    clearMessages();
    try {
      await updateMenuCombo(combo.id, { isActive: !combo.isActive });
      setStatus(combo.isActive ? "Combo oculto para caja." : "Combo visible en caja.");
      await loadCatalog();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  return (
    <section className="menu-catalog-page">
      <header className="menu-catalog-head">
        <div>
          <h2>{currentMeta.title}</h2>
          <p>{currentMeta.description}</p>
        </div>
      </header>

      <nav className="menu-catalog-tabs" aria-label="Secciones del menu">
        {TABS.map((tab) => (
          <button key={tab} type="button" className={activeTab === tab ? "is-active" : ""} onClick={() => handleTabChange(tab)}>
            {tab}
          </button>
        ))}
      </nav>

      <div className="menu-catalog-toolbar">
        <p>{currentMeta.count} {activeTab.toLowerCase()} - {currentMeta.active} active</p>
        <button type="button" className="menu-catalog-action" onClick={() => setShowCreate((current) => !current)}>
          <span>+</span>
          {currentMeta.button}
        </button>
      </div>

      {showCreate && activeTab === "Productos" && (
        <form className="menu-create-panel" onSubmit={handleCreateProduct}>
          <label>
            <span>Nombre</span>
            <input value={productForm.name} onChange={(event) => setProductForm((form) => ({ ...form, name: event.target.value }))} placeholder="Classic Burger" />
          </label>
          <label>
            <span>Precio</span>
            <input type="number" step="0.01" value={productForm.price} onChange={(event) => setProductForm((form) => ({ ...form, price: event.target.value }))} placeholder="12.99" />
          </label>
          <label>
            <span>Categoria</span>
            <select value={productForm.categoryId} onChange={(event) => setProductForm((form) => ({ ...form, categoryId: event.target.value }))}>
              <option value="">Seleccionar</option>
              {activeCategories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>
          <label className="is-wide">
            <span>Descripcion</span>
            <textarea value={productForm.description} onChange={(event) => setProductForm((form) => ({ ...form, description: event.target.value }))} placeholder="Descripcion breve del producto." />
          </label>
          <button type="submit">Crear producto</button>
        </form>
      )}

      {showCreate && activeTab === "Categorias" && (
        <form className="menu-create-panel" onSubmit={handleCreateCategory}>
          <label>
            <span>Nombre</span>
            <input value={categoryForm.name} onChange={(event) => setCategoryForm((form) => ({ ...form, name: event.target.value }))} placeholder="Burgers" />
          </label>
          <label className="is-wide">
            <span>Descripcion</span>
            <textarea value={categoryForm.description} onChange={(event) => setCategoryForm((form) => ({ ...form, description: event.target.value }))} placeholder="Premium beef and chicken burgers" />
          </label>
          <button type="submit">Crear categoria</button>
        </form>
      )}

      {showCreate && activeTab === "Combos" && (
        <form className="menu-create-panel" onSubmit={handleCreateCombo}>
          <label>
            <span>Nombre</span>
            <input value={comboForm.name} onChange={(event) => setComboForm((form) => ({ ...form, name: event.target.value }))} placeholder="Classic Burger Meal" />
          </label>
          <label>
            <span>Precio</span>
            <input type="number" step="0.01" value={comboForm.price} onChange={(event) => setComboForm((form) => ({ ...form, price: event.target.value }))} placeholder="15.99" />
          </label>
          <label className="is-wide">
            <span>Descripcion</span>
            <textarea value={comboForm.description} onChange={(event) => setComboForm((form) => ({ ...form, description: event.target.value }))} placeholder="Burger + Fries + Drink" />
          </label>
          <div className="menu-combo-items">
            <div className="menu-combo-items-head">
              <span>Productos incluidos</span>
              <button type="button" onClick={addComboItem}>+ Agregar producto</button>
            </div>
            {comboForm.items.map((item, index) => (
              <div className="menu-combo-item-row" key={`combo-item-${index}`}>
                <select value={item.productId} onChange={(event) => updateComboItem(index, "productId", event.target.value)}>
                  <option value="">Seleccionar producto</option>
                  {activeProducts.map((product) => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
                <input type="number" min="1" value={item.quantity} onChange={(event) => updateComboItem(index, "quantity", event.target.value)} />
                <button type="button" onClick={() => removeComboItem(index)}>Quitar</button>
              </div>
            ))}
          </div>
          <button type="submit">Crear combo</button>
        </form>
      )}

      {status && <p className="admin-users-success">{status}</p>}
      {error && <p className="admin-users-error">{error}</p>}
      {isLoading && <p className="menu-loading">Cargando catalogo...</p>}

      {activeTab === "Productos" && (
        <div className="menu-card-grid">
          {catalog.products.map((product) => (
            <article className="menu-catalog-card" key={product.id}>
              <button className="menu-card-menu" type="button" aria-label={`Acciones para ${product.name}`}>⋮</button>
              <div className="menu-card-icon">{getInitials(product.name)}</div>
              <h3>{product.name}</h3>
              <p>{product.description || "Producto disponible para venta en caja."}</p>
              <div className="menu-card-foot">
                <span>${product.price}</span>
                <button type="button" className={product.isActive ? "menu-switch is-on" : "menu-switch"} onClick={() => toggleProduct(product)} aria-label="Cambiar disponibilidad" />
              </div>
            </article>
          ))}
        </div>
      )}

      {activeTab === "Categorias" && (
        <div className="menu-card-grid">
          {catalog.categories.map((category) => (
            <article className="menu-catalog-card" key={category.id}>
              <button className="menu-card-menu" type="button" aria-label={`Acciones para ${category.name}`}>⋮</button>
              <div className="menu-card-icon">
                <svg width="27" height="27" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 3 5 7v10l7 4 7-4V7l-7-4Zm0 0v8M5 7l7 4 7-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3>{category.name}</h3>
              <p>{category.description || "Categoria del catalogo del restaurante."}</p>
              <div className="menu-card-foot">
                <span>{catalog.products.filter((product) => product.categoryId === category.id || product.categoryName === category.name).length} products</span>
                <button type="button" className={category.isActive ? "menu-switch is-on" : "menu-switch"} aria-label="Categoria activa" />
              </div>
            </article>
          ))}
        </div>
      )}

      {activeTab === "Combos" && (
        <div className="menu-card-grid">
          {catalog.combos.map((combo) => (
            <article className="menu-catalog-card" key={combo.id}>
              <button className="menu-card-menu" type="button" aria-label={`Acciones para ${combo.name}`}>⋮</button>
              <div className="menu-card-icon">{getInitials(combo.name)}</div>
              <h3>{combo.name}</h3>
              <p>{combo.description || "Combo con precio especial para caja."}</p>
              <div className="menu-card-foot">
                <span>${combo.price}</span>
                <button type="button" className={combo.isActive ? "menu-switch is-on" : "menu-switch"} onClick={() => toggleCombo(combo)} aria-label="Cambiar disponibilidad" />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
