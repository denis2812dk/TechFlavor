import { useEffect, useMemo, useState } from "react";
import {
  createMenuCategory,
  createMenuCombo,
  createMenuProduct,
  getErrorMessage,
  getMenuCatalog,
  listIngredients,
  setProductRecipe,
  updateMenuCombo,
  updateMenuProduct,
} from "../../lib/auth";

const TABS = ["Productos", "Categorias", "Combos"];
const emptyCategory = { name: "", description: "" };
const emptyProduct = { name: "", description: "", price: "", categoryId: "" };
const emptyComboItem = { productId: "", quantity: 1 };
const emptyCombo = { name: "", description: "", price: "", items: [emptyComboItem] };
const emptyRecipeItem = { ingredientId: "", quantity: "" };

const getInitials = (value) => value
  .split(" ")
  .map((part) => part[0])
  .join("")
  .slice(0, 2)
  .toUpperCase();

export const MenuManagement = () => {
  const [activeTab, setActiveTab] = useState("Categorias");
  const [catalog, setCatalog] = useState({ categories: [], products: [], combos: [] });
  const [ingredients, setIngredients] = useState([]);
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [comboForm, setComboForm] = useState(emptyCombo);
  const [recipeProduct, setRecipeProduct] = useState(null);
  const [recipeRows, setRecipeRows] = useState([emptyRecipeItem]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const loadCatalog = async () => {
    try {
      const [data, ingredientData] = await Promise.all([
        getMenuCatalog({ includeInactive: true }),
        listIngredients(),
      ]);
      setCatalog(data);
      setIngredients(ingredientData.ingredients || []);
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
    setRecipeProduct(null);
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

  const openRecipeEditor = (product) => {
    clearMessages();
    setRecipeProduct(product);
    setRecipeRows(
      product.recipe?.length
        ? product.recipe.map((item) => ({
          ingredientId: item.ingredientId,
          quantity: item.quantity,
        }))
        : [{ ...emptyRecipeItem }],
    );
  };

  const updateRecipeRow = (index, field, value) => {
    setRecipeRows((rows) => rows.map((row, rowIndex) => (
      rowIndex === index ? { ...row, [field]: value } : row
    )));
  };

  const addRecipeRow = () => {
    setRecipeRows((rows) => [...rows, { ...emptyRecipeItem }]);
  };

  const removeRecipeRow = (index) => {
    setRecipeRows((rows) => (
      rows.length === 1
        ? [{ ...emptyRecipeItem }]
        : rows.filter((_, rowIndex) => rowIndex !== index)
    ));
  };

  const handleSaveRecipe = async (event) => {
    event.preventDefault();
    clearMessages();

    if (!recipeProduct) return;

    const recipe = recipeRows
      .filter((row) => row.ingredientId && row.quantity)
      .map((row) => ({
        ingredientId: row.ingredientId,
        quantity: Number(row.quantity),
      }));

    try {
      await setProductRecipe(recipeProduct.id, { ingredients: recipe });
      setRecipeProduct(null);
      setRecipeRows([{ ...emptyRecipeItem }]);
      setStatus("Receta actualizada correctamente.");
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

      {recipeProduct && activeTab === "Productos" && (
        <form className="menu-recipe-panel" onSubmit={handleSaveRecipe}>
          <div className="menu-recipe-head">
            <div>
              <p className="admin-users-kicker">Receta</p>
              <h3>{recipeProduct.name}</h3>
              <span>Define cuánto inventario descuenta cada venta de este producto.</span>
            </div>
            <button type="button" onClick={() => setRecipeProduct(null)}>Cerrar</button>
          </div>

          <div className="menu-recipe-list">
            {recipeRows.map((row, index) => (
              <div className="menu-recipe-row" key={`recipe-${index}`}>
                <select value={row.ingredientId} onChange={(event) => updateRecipeRow(index, "ingredientId", event.target.value)}>
                  <option value="">Seleccionar ingrediente</option>
                  {ingredients.map((ingredient) => (
                    <option key={ingredient.id} value={ingredient.id}>
                      {ingredient.name} ({ingredient.unitOfMeasure})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={row.quantity}
                  onChange={(event) => updateRecipeRow(index, "quantity", event.target.value)}
                  placeholder="Cantidad"
                />
                <button type="button" onClick={() => removeRecipeRow(index)}>Quitar</button>
              </div>
            ))}
          </div>

          <div className="menu-recipe-actions">
            <button type="button" onClick={addRecipeRow}>+ Agregar ingrediente</button>
            <button type="submit">Guardar receta</button>
          </div>
        </form>
      )}

      {activeTab === "Productos" && (
        <div className="menu-card-grid">
          {catalog.products.map((product) => (
            <article className="menu-catalog-card" key={product.id}>
              <button className="menu-card-menu" type="button" aria-label={`Acciones para ${product.name}`}>⋮</button>
              <div className="menu-card-icon">{getInitials(product.name)}</div>
              <h3>{product.name}</h3>
              <p>{product.description || "Producto disponible para venta en caja."}</p>
              {product.recipe?.length ? (
                <div className="menu-card-recipe">
                  {product.recipe.map((item) => (
                    <span key={item.id}>{item.quantity} {item.unitOfMeasure} {item.ingredientName}</span>
                  ))}
                </div>
              ) : (
                <div className="menu-card-recipe">
                  <span>Sin receta de inventario</span>
                </div>
              )}
              <div className="menu-card-foot">
                <span>${product.price}</span>
                <div className="menu-card-actions">
                  <button type="button" onClick={() => openRecipeEditor(product)}>Receta</button>
                  <button type="button" className={product.isActive ? "menu-switch is-on" : "menu-switch"} onClick={() => toggleProduct(product)} aria-label="Cambiar disponibilidad" />
                </div>
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