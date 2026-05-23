import { useEffect, useMemo, useState } from "react";
import {
  createMenuCategory,
  createMenuCombo,
  createMenuProduct,
  updateMenuCategory,
  getErrorMessage,
  getMenuCatalog,
  listIngredients,
  setProductRecipe,
  updateMenuCombo,
  updateMenuProduct,
} from "../../lib/auth";

const TABS = ["Productos", "Categorias", "Combos"];
const emptyCategory = { name: "", description: "", isActive: true };
const emptyProduct = { name: "", description: "", price: "", categoryId: "", isActive: true };
const emptyComboItem = { productId: "", quantity: 1 };
const emptyCombo = { name: "", description: "", price: "", items: [emptyComboItem] };
const emptyRecipeItem = { ingredientId: "", quantity: "", searchText: "", isSearching: false, unitOfMeasure: "" };

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
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [hoveredButton, setHoveredButton] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);

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
    setEditingProduct(null);
    setEditingCategory(null);
    setRecipeRows([{ ...emptyRecipeItem }]);
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
      const response = await createMenuProduct(productForm);

      const validRecipe = recipeRows
        .filter((row) => row.ingredientId && row.quantity)
        .map((row) => ({
          ingredientId: row.ingredientId,
          quantity: parseInt(row.quantity, 10),
        }));

      // Si se agregó una receta válida y el producto fue creado con éxito
      if (validRecipe.length > 0 && response?.product?.id) {
        await setProductRecipe(response.product.id, { ingredients: validRecipe });
      }

      setProductForm(emptyProduct);
      setRecipeRows([{ ...emptyRecipeItem }]);
      setStatus("Producto y receta creados correctamente.");
      setShowCreate(false);
      await loadCatalog();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const handleUpdateProduct = async (event) => {
    event.preventDefault();
    clearMessages();
    try {
      await updateMenuProduct(editingProduct.id, productForm);

      const validRecipe = recipeRows
        .filter((row) => row.ingredientId && row.quantity)
        .map((row) => ({
          ingredientId: row.ingredientId,
          quantity: parseInt(row.quantity, 10),
        }));

      await setProductRecipe(editingProduct.id, { ingredients: validRecipe });

      setEditingProduct(null);
      setProductForm(emptyProduct);
      setRecipeRows([{ ...emptyRecipeItem }]);
      setStatus("Producto actualizado correctamente.");
      await loadCatalog();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const openProductEditor = (product) => {
    clearMessages();
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || "",
      price: product.price,
      categoryId: product.categoryId,
      isActive: product.isActive,
    });
    setRecipeRows(
      product.recipe?.length
        ? [
            ...product.recipe.map((item) => ({
              ingredientId: item.ingredientId,
              quantity: item.quantity,
              searchText: item.ingredientName,
              isSearching: false,
              unitOfMeasure: item.unitOfMeasure,
            })),
            { ...emptyRecipeItem }
          ]
        : [{ ...emptyRecipeItem }]
    );
    setShowCreate(false);
  };

  const handleUpdateCategory = async (event) => {
    event.preventDefault();
    clearMessages();
    try {
      await updateMenuCategory(editingCategory.id, categoryForm);
      setEditingCategory(null);
      setCategoryForm(emptyCategory);
      setStatus("Categoria actualizada correctamente.");
      await loadCatalog();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const openCategoryEditor = (category) => {
    clearMessages();
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || "",
      isActive: category.isActive,
    });
    setShowCreate(false);
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
        ? [
            ...product.recipe.map((item) => ({
              ingredientId: item.ingredientId,
              quantity: item.quantity,
              searchText: item.ingredientName,
              isSearching: false,
              unitOfMeasure: item.unitOfMeasure,
            })),
            { ...emptyRecipeItem }
          ]
        : [{ ...emptyRecipeItem }]
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

  const handleSearchChange = (index, text) => {
    setRecipeRows((rows) => rows.map((row, rowIndex) => (
      rowIndex === index ? { ...row, searchText: text, isSearching: true, ingredientId: "", unitOfMeasure: "" } : row
    )));
  };

  const handleSelectIngredient = (index, ingredient) => {
    setRecipeRows((rows) => {
      const newRows = [...rows];
      newRows[index] = {
        ...newRows[index],
        ingredientId: ingredient.id,
        searchText: ingredient.name,
        unitOfMeasure: ingredient.unitOfMeasure,
        isSearching: false,
      };
      
      // Agregar fila vacía automáticamente si llenamos la última
      if (index === newRows.length - 1) {
        newRows.push({ ...emptyRecipeItem });
      }
      return newRows;
    });
  };

  const handleSaveRecipe = async (event) => {
    event.preventDefault();
    clearMessages();

    if (!recipeProduct) return;

    const recipe = recipeRows
      .filter((row) => row.ingredientId && row.quantity)
      .map((row) => ({
        ingredientId: row.ingredientId,
        quantity: parseInt(row.quantity, 10),
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

  // Extraemos la interfaz del buscador predictivo para usarlo al crear y al editar
  const renderRecipeRow = (row, index) => {
    const selectedIds = recipeRows.map(r => r.ingredientId).filter(id => id && id !== row.ingredientId);
    return (
    <div className="menu-recipe-row" key={`recipe-row-${index}`} style={{ alignItems: "flex-start" }}>
      <div style={{ position: "relative", flex: 1 }}>
        <input
          type="text"
          value={row.searchText}
          onChange={(event) => handleSearchChange(index, event.target.value)}
          onFocus={() => {
            setRecipeRows((r) => r.map((r2, i) => i === index ? { ...r2, isSearching: true } : r2));
          }}
          onBlur={() => {
            // Pequeño retraso para dar tiempo a que el clic (onMouseDown) seleccione el ingrediente
            setTimeout(() => {
              setRecipeRows((rows) => rows.map((r, i) => {
                if (i === index) {
                  // Restaura el nombre del ingrediente seleccionado o lo borra si no es válido
                  const matched = ingredients.find(ing => ing.id === r.ingredientId);
                  return {
                    ...r,
                    searchText: matched ? matched.name : "",
                    isSearching: false
                  };
                }
                return r;
              }));
            }, 150);
          }}
          placeholder="Buscar ingrediente..."
          style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
        />
        {row.isSearching && (
          <ul style={{
            position: "relative", background: "#fff",
            border: "1px solid #ccc", borderRadius: "4px", zIndex: 10, listStyle: "none", padding: 0, margin: "4px 0 0 0",
            maxHeight: "150px", overflowY: "auto", boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
          }}>
            {ingredients
              .filter(ing => !selectedIds.includes(ing.id))
              .filter(ing => !row.searchText || ing.name.toLowerCase().includes(row.searchText.toLowerCase()))
              .map(ing => (
                <li
                  key={ing.id}
                  style={{ padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid #eee" }}
                  onMouseDown={() => handleSelectIngredient(index, ing)}
                >
                  {ing.name} <small style={{ color: "#666" }}>({ing.unitOfMeasure})</small>
                </li>
              ))}
            {ingredients.filter(ing => !selectedIds.includes(ing.id)).filter(ing => !row.searchText || ing.name.toLowerCase().includes(row.searchText.toLowerCase())).length === 0 && (
              <li style={{ padding: "8px 12px", color: "#999" }}>No se encontraron ingredientes</li>
            )}
          </ul>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "140px" }}>
        <input
          type="number"
          min="1"
          step="1"
          value={row.quantity}
          onChange={(event) => {
            const val = event.target.value;
            updateRecipeRow(index, "quantity", val ? parseInt(val, 10).toString() : "");
          }}
          placeholder="0"
          disabled={!row.ingredientId}
          style={{ width: "80px", padding: "8px", boxSizing: "border-box" }}
        />
        <span style={{ fontSize: "0.9rem", color: "#555", minWidth: "50px", overflow: "hidden", textOverflow: "ellipsis" }}>
          {row.unitOfMeasure || "-"}
        </span>
      </div>
      <button type="button" onClick={() => removeRecipeRow(index)} style={{ marginTop: "4px" }}>Quitar</button>
    </div>
    );
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
        <button type="button" className="menu-catalog-action" onClick={() => {
          if (!showCreate) setRecipeRows([{ ...emptyRecipeItem }]);
          setShowCreate((current) => !current);
        }}>
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
          
          <div className="is-wide menu-combo-items" style={{ gridColumn: "1 / -1" }}>
            <div className="menu-combo-items-head">
              <span>Receta del producto (Opcional)</span>
              <button type="button" onClick={addRecipeRow}>+ Agregar ingrediente</button>
            </div>
            {recipeRows.map((row, index) => renderRecipeRow(row, index))}
          </div>

          <button type="submit">Crear producto</button>
        </form>
      )}

      {editingProduct && activeTab === "Productos" && (
        <form className="menu-create-panel" onSubmit={handleUpdateProduct}>
          <div className="is-wide d-flex justify-content-between align-items-center mb-3">
            <h3 className="h5 mb-0">Editando: {editingProduct.name}</h3>
            <div className="d-flex align-items-center gap-2">
              <span className="small text-muted">{productForm.isActive ? "Producto Activo" : "Producto Inactivo"}</span>
              <button 
                type="button" 
                className={productForm.isActive ? "menu-switch is-on" : "menu-switch"} 
                onClick={() => setProductForm(f => ({ ...f, isActive: !f.isActive }))}
              />
            </div>
          </div>
          <label>
            <span>Nombre</span>
            <input value={productForm.name} onChange={(event) => setProductForm((form) => ({ ...form, name: event.target.value }))} />
          </label>
          <label>
            <span>Precio</span>
            <input type="number" step="0.01" value={productForm.price} onChange={(event) => setProductForm((form) => ({ ...form, price: event.target.value }))} />
          </label>
          <label>
            <span>Categoria</span>
            <select value={productForm.categoryId} onChange={(event) => setProductForm((form) => ({ ...form, categoryId: event.target.value }))}>
              {activeCategories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>
          <label className="is-wide">
            <span>Descripcion</span>
            <textarea value={productForm.description} onChange={(event) => setProductForm((form) => ({ ...form, description: event.target.value }))} />
          </label>
          
          <div className="is-wide menu-combo-items" style={{ gridColumn: "1 / -1" }}>
            <div className="menu-combo-items-head">
              <span>Receta del producto</span>
              <button type="button" onClick={addRecipeRow}>+ Agregar ingrediente</button>
            </div>
            {recipeRows.map((row, index) => renderRecipeRow(row, index))}
          </div>

          <div className="is-wide d-flex gap-2">
            <button type="submit" className="flex-grow-1">Guardar cambios</button>
            <button type="button" className="is-secondary" onClick={() => setEditingProduct(null)}>Cancelar</button>
          </div>
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

      {editingCategory && activeTab === "Categorias" && (
        <form className="menu-create-panel" onSubmit={handleUpdateCategory}>
          <div className="is-wide d-flex justify-content-between align-items-center mb-3">
            <h3 className="h5 mb-0">Editando Categoria: {editingCategory.name}</h3>
            <div className="d-flex align-items-center gap-2">
              <span className="small text-muted">{categoryForm.isActive ? "Categoria Activa" : "Categoria Inactiva"}</span>
              <button 
                type="button" 
                className={categoryForm.isActive ? "menu-switch is-on" : "menu-switch"} 
                onClick={() => setCategoryForm(f => ({ ...f, isActive: !f.isActive }))}
              />
            </div>
          </div>
          <label className="is-wide">
            <span>Nombre</span>
            <input value={categoryForm.name} onChange={(event) => setCategoryForm((form) => ({ ...form, name: event.target.value }))} />
          </label>
          <label className="is-wide">
            <span>Descripcion</span>
            <textarea value={categoryForm.description} onChange={(event) => setCategoryForm((form) => ({ ...form, description: event.target.value }))} />
          </label>
          
          <div className="is-wide d-flex gap-2">
            <button type="submit" className="flex-grow-1">Guardar cambios</button>
            <button type="button" className="is-secondary" onClick={() => setEditingCategory(null)}>Cancelar</button>
          </div>
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
            {recipeRows.map((row, index) => renderRecipeRow(row, index))}
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
              <div style={{ position: "absolute", top: "1rem", right: "1rem" }}>
                <button 
                  className="menu-card-menu" 
                  type="button" 
                  onClick={() => setActiveDropdown(activeDropdown === product.id ? null : product.id)}
                  onMouseEnter={() => setHoveredButton(product.id)}
                  onMouseLeave={() => setHoveredButton(null)}
                  style={{
                    borderRadius: "50%",
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s",
                    border: "1px solid #eee",
                    backgroundColor: hoveredButton === product.id ? "#2D1810" : "#fff",
                    color: hoveredButton === product.id ? "#fff" : "#2D1810",
                    cursor: "pointer"
                  }}
                >
                  ⋮
                </button>
                {activeDropdown === product.id && (
                  <div className="menu-dropdown-content" style={{
                    position: "absolute", right: 0, top: "100%", background: "#fff", 
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)", borderRadius: "6px", 
                    padding: "4px", zIndex: 20, minWidth: "140px"
                  }}>
                    <button 
                      type="button" 
                      className="menu-dropdown-item" 
                      onMouseEnter={() => setHoveredItem(product.id)}
                      onMouseLeave={() => setHoveredItem(null)}
                      onClick={() => {
                      openProductEditor(product);
                      setActiveDropdown(null);
                    }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "8px 12px",
                        backgroundColor: hoveredItem === product.id ? "#2D1810" : "transparent",
                        color: hoveredItem === product.id ? "#fff" : "#2D1810",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      Editar producto
                    </button>
                  </div>
                )}
              </div>
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
              <div style={{ position: "absolute", top: "1rem", right: "1rem" }}>
                <button 
                  className="menu-card-menu" 
                  type="button" 
                  onClick={() => setActiveDropdown(activeDropdown === category.id ? null : category.id)}
                  onMouseEnter={() => setHoveredButton(category.id)}
                  onMouseLeave={() => setHoveredButton(null)}
                  style={{
                    borderRadius: "50%", width: "32px", height: "32px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s", border: "1px solid #eee",
                    backgroundColor: hoveredButton === category.id ? "#2D1810" : "#fff",
                    color: hoveredButton === category.id ? "#fff" : "#2D1810",
                    cursor: "pointer"
                  }}
                >
                  ⋮
                </button>
                {activeDropdown === category.id && (
                  <div className="menu-dropdown-content" style={{
                    position: "absolute", right: 0, top: "100%", background: "#fff", 
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)", borderRadius: "6px", 
                    padding: "4px", zIndex: 20, minWidth: "160px"
                  }}>
                    <button 
                      type="button" 
                      onMouseEnter={() => setHoveredItem(category.id)}
                      onMouseLeave={() => setHoveredItem(null)}
                      onClick={() => {
                        openCategoryEditor(category);
                        setActiveDropdown(null);
                      }}
                      style={{
                        width: "100%", textAlign: "left", padding: "8px 12px", border: "none", borderRadius: "4px",
                        backgroundColor: hoveredItem === category.id ? "#2D1810" : "transparent",
                        color: hoveredItem === category.id ? "#fff" : "#2D1810",
                        cursor: "pointer", transition: "all 0.2s"
                      }}
                    >
                      Editar categoria
                    </button>
                  </div>
                )}
              </div>
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
              <button 
                className="menu-card-menu" 
                type="button" 
                onMouseEnter={() => setHoveredButton(combo.id)}
                onMouseLeave={() => setHoveredButton(null)}
                style={{
                  position: "absolute", top: "1rem", right: "1rem",
                  borderRadius: "50%", width: "32px", height: "32px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s", border: "1px solid #eee",
                  backgroundColor: hoveredButton === combo.id ? "#2D1810" : "#fff",
                  color: hoveredButton === combo.id ? "#fff" : "#2D1810",
                  cursor: "pointer"
                }}
              >
                ⋮
              </button>
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