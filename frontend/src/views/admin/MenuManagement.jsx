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

const TABS = ["Productos", "Categorias", "Combos", "Inventario"];
const emptyCategory = { name: "", description: "" };
const emptyProduct = { name: "", description: "", price: "", categoryId: "" };
const emptyCombo = { name: "", description: "", price: "", productId: "", quantity: 1 };

export const MenuManagement = () => {
  const [activeTab, setActiveTab] = useState("Productos");
  const [catalog, setCatalog] = useState({ categories: [], products: [], combos: [] });
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [comboForm, setComboForm] = useState(emptyCombo);
  const [imageName, setImageName] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

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

  const activeProducts = catalog.products.filter((product) => product.isActive);
  const selectedCategory = catalog.categories.find((category) => category.id === productForm.categoryId);
  const previewProduct = useMemo(() => ({
    name: productForm.name || "Nuevo producto",
    description: productForm.description || "Descripcion breve del producto para el POS.",
    price: productForm.price || "0.00",
    category: selectedCategory?.name || "Sin categoria",
    imageName,
  }), [imageName, productForm, selectedCategory]);

  const clearMessages = () => {
    setStatus("");
    setError("");
  };

  const handleCreateCategory = async (event) => {
    event.preventDefault();
    clearMessages();
    try {
      await createMenuCategory(categoryForm);
      setCategoryForm(emptyCategory);
      setStatus("Categoria creada.");
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
      setImageName("");
      setStatus("Producto creado.");
      await loadCatalog();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const handleCreateCombo = async (event) => {
    event.preventDefault();
    clearMessages();
    try {
      await createMenuCombo({
        name: comboForm.name,
        description: comboForm.description,
        price: comboForm.price,
        items: [{ productId: comboForm.productId, quantity: Number(comboForm.quantity) }],
      });
      setComboForm(emptyCombo);
      setStatus("Combo creado.");
      await loadCatalog();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
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
    <section className="menu-editor">
      <header className="menu-editor-top">
        <div>
          <p className="admin-users-kicker">Catalogo inteligente</p>
          <h2>Menu operativo</h2>
          <p>Administra productos, categorias y combos con una experiencia lista para POS.</p>
        </div>
        <div className="menu-stats">
          <span>{catalog.products.length} productos</span>
          <span>{catalog.combos.length} combos</span>
          <span>{activeProducts.length} visibles</span>
        </div>
      </header>

      <nav className="menu-tabs" aria-label="Secciones del menu">
        {TABS.map((tab) => (
          <button key={tab} type="button" className={activeTab === tab ? "is-active" : ""} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </nav>

      <div className="menu-editor-layout">
        <main className="menu-editor-main">
          {activeTab === "Productos" && (
            <>
              <form className="menu-saas-form" onSubmit={handleCreateProduct}>
                <div className="menu-section-heading">
                  <span>01</span>
                  <div>
                    <h3>Informacion del producto</h3>
                    <p>Estos datos se muestran directamente en caja.</p>
                  </div>
                </div>

                <label>
                  <span>Nombre</span>
                  <input value={productForm.name} onChange={(event) => setProductForm((form) => ({ ...form, name: event.target.value }))} placeholder="Limonada artesanal" />
                </label>

                <div className="menu-two-columns">
                  <label>
                    <span>Precio</span>
                    <input type="number" step="0.01" value={productForm.price} onChange={(event) => setProductForm((form) => ({ ...form, price: event.target.value }))} placeholder="2.50" />
                  </label>
                  <label>
                    <span>Categoria</span>
                    <select value={productForm.categoryId} onChange={(event) => setProductForm((form) => ({ ...form, categoryId: event.target.value }))}>
                      <option value="">Seleccionar</option>
                      {catalog.categories.filter((category) => category.isActive).map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <label>
                  <span>Descripcion</span>
                  <textarea value={productForm.description} onChange={(event) => setProductForm((form) => ({ ...form, description: event.target.value }))} placeholder="Natural, fresca y servida con hierbabuena." />
                </label>

                <label className="menu-upload">
                  <input type="file" accept="image/*" onChange={(event) => setImageName(event.target.files?.[0]?.name || "")} />
                  <span>Arrastra una imagen o selecciona archivo</span>
                  <small>{imageName || "PNG, JPG o WEBP para futura vista POS"}</small>
                </label>

                <button className="menu-primary-action" type="submit">Crear producto</button>
              </form>

              <section className="menu-flat-list">
                <div className="menu-section-heading">
                  <span>02</span>
                  <div>
                    <h3>Catalogo actual</h3>
                    <p>Desactivar oculta el producto inmediatamente para caja.</p>
                  </div>
                </div>
                {catalog.products.map((product) => (
                  <article className="menu-inline-row" key={product.id}>
                    <div>
                      <strong>{product.name}</strong>
                      <p>{product.categoryName} · ${product.price}</p>
                    </div>
                    <span className={product.isActive ? "menu-status-pill is-on" : "menu-status-pill"}>{product.isActive ? "Disponible" : "Oculto"}</span>
                    <button type="button" onClick={() => toggleProduct(product)}>{product.isActive ? "Desactivar" : "Activar"}</button>
                  </article>
                ))}
              </section>
            </>
          )}

          {activeTab === "Categorias" && (
            <form className="menu-saas-form" onSubmit={handleCreateCategory}>
              <div className="menu-section-heading">
                <span>01</span>
                <div>
                  <h3>Nueva categoria</h3>
                  <p>Organiza el catalogo para que caja encuentre productos rapido.</p>
                </div>
              </div>
              <label>
                <span>Nombre</span>
                <input value={categoryForm.name} onChange={(event) => setCategoryForm((form) => ({ ...form, name: event.target.value }))} placeholder="Bebidas" />
              </label>
              <label>
                <span>Descripcion</span>
                <textarea value={categoryForm.description} onChange={(event) => setCategoryForm((form) => ({ ...form, description: event.target.value }))} placeholder="Bebidas frias, calientes y naturales." />
              </label>
              <button className="menu-primary-action" type="submit">Crear categoria</button>
            </form>
          )}

          {activeTab === "Combos" && (
            <form className="menu-saas-form" onSubmit={handleCreateCombo}>
              <div className="menu-section-heading">
                <span>01</span>
                <div>
                  <h3>Combo con precio especial</h3>
                  <p>Agrupa productos activos en una oferta para POS.</p>
                </div>
              </div>
              <div className="menu-two-columns">
                <label>
                  <span>Nombre</span>
                  <input value={comboForm.name} onChange={(event) => setComboForm((form) => ({ ...form, name: event.target.value }))} placeholder="Combo almuerzo" />
                </label>
                <label>
                  <span>Precio especial</span>
                  <input type="number" step="0.01" value={comboForm.price} onChange={(event) => setComboForm((form) => ({ ...form, price: event.target.value }))} placeholder="7.99" />
                </label>
              </div>
              <div className="menu-two-columns">
                <label>
                  <span>Producto incluido</span>
                  <select value={comboForm.productId} onChange={(event) => setComboForm((form) => ({ ...form, productId: event.target.value }))}>
                    <option value="">Seleccionar</option>
                    {activeProducts.map((product) => (
                      <option key={product.id} value={product.id}>{product.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Cantidad</span>
                  <input type="number" min="1" value={comboForm.quantity} onChange={(event) => setComboForm((form) => ({ ...form, quantity: event.target.value }))} />
                </label>
              </div>
              <label>
                <span>Descripcion</span>
                <textarea value={comboForm.description} onChange={(event) => setComboForm((form) => ({ ...form, description: event.target.value }))} placeholder="Plato fuerte con bebida y acompanamiento." />
              </label>
              <button className="menu-primary-action" type="submit">Crear combo</button>

              <div className="menu-flat-list">
                {catalog.combos.map((combo) => (
                  <article className="menu-inline-row" key={combo.id}>
                    <div>
                      <strong>{combo.name}</strong>
                      <p>${combo.price}</p>
                    </div>
                    <span className={combo.isActive ? "menu-status-pill is-on" : "menu-status-pill"}>{combo.isActive ? "Disponible" : "Oculto"}</span>
                    <button type="button" onClick={() => toggleCombo(combo)}>{combo.isActive ? "Desactivar" : "Activar"}</button>
                  </article>
                ))}
              </div>
            </form>
          )}

          {activeTab === "Inventario" && (
            <section className="menu-saas-form">
              <div className="menu-section-heading">
                <span>01</span>
                <div>
                  <h3>Inventario conectado</h3>
                  <p>Espacio preparado para vincular productos con ingredientes y existencias.</p>
                </div>
              </div>
              <div className="menu-inventory-empty">
                <strong>Modulo listo para la siguiente historia</strong>
                <p>Aqui podremos descontar ingredientes, marcar stock bajo y pausar productos automaticamente.</p>
              </div>
            </section>
          )}

          {status && <p className="admin-users-success">{status}</p>}
          {error && <p className="admin-users-error">{error}</p>}
          {isLoading && <p>Cargando catalogo...</p>}
        </main>

        <aside className="menu-preview-panel">
          <p className="admin-users-kicker">Preview POS</p>
          <div className="menu-pos-card">
            <div className="menu-pos-image">
              <span>{previewProduct.imageName ? "IMG" : "TF"}</span>
            </div>
            <div className="menu-pos-body">
              <div className="menu-pos-row">
                <span className="menu-category-badge">{previewProduct.category}</span>
                <span className="menu-status-pill is-on">Disponible</span>
              </div>
              <h3>{previewProduct.name}</h3>
              <p>{previewProduct.description}</p>
              <strong>${previewProduct.price}</strong>
            </div>
          </div>

          <div className="menu-pos-meta">
            <span>Visible para caja</span>
            <span>Precio especial en combos</span>
            <span>Categoria sincronizada</span>
          </div>
        </aside>
      </div>
    </section>
  );
};
