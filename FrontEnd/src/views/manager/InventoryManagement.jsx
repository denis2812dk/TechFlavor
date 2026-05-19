import { useEffect, useMemo, useState } from "react";
import {
  createIngredient,
  deleteIngredient,
  getErrorMessage,
  listIngredients,
  registerShrinkage,
  updateIngredient,
} from "../../lib/auth";

const emptyShrinkage = {
  ingredientId: "",
  quantity: "",
  reason: "",
};

const emptyIngredient = {
  name: "",
  unitOfMeasure: "",
  currentStock: "",
};

const toStock = (value) => Number(value || 0).toFixed(2);

export const InventoryManagement = () => {
  const [ingredients, setIngredients] = useState([]);
  const [shrinkageForm, setShrinkageForm] = useState(emptyShrinkage);
  const [ingredientForm, setIngredientForm] = useState(emptyIngredient);
  const [editingIngredientId, setEditingIngredientId] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadIngredients = async () => {
    try {
      const data = await listIngredients();
      setIngredients(data.ingredients || []);
      setError("");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadIngredients();
  }, []);

  const selectedIngredient = useMemo(() => (
    ingredients.find((ingredient) => ingredient.id === shrinkageForm.ingredientId)
  ), [shrinkageForm.ingredientId, ingredients]);

  const lowStockCount = useMemo(() => (
    ingredients.filter((ingredient) => Number(ingredient.currentStock || 0) <= 0).length
  ), [ingredients]);

  const clearMessages = () => {
    setError("");
    setStatus("");
  };

  const resetIngredientForm = () => {
    setIngredientForm(emptyIngredient);
    setEditingIngredientId("");
  };

  const handleIngredientSubmit = async (event) => {
    event.preventDefault();
    clearMessages();
    setIsSaving(true);

    const payload = {
      name: ingredientForm.name,
      unitOfMeasure: ingredientForm.unitOfMeasure,
      currentStock: ingredientForm.currentStock || 0,
    };

    try {
      if (editingIngredientId) {
        await updateIngredient(editingIngredientId, payload);
        setStatus("Ingrediente actualizado correctamente.");
      } else {
        await createIngredient(payload);
        setStatus("Ingrediente creado correctamente.");
      }

      resetIngredientForm();
      await loadIngredients();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSaving(false);
    }
  };

  const handleShrinkageSubmit = async (event) => {
    event.preventDefault();
    clearMessages();
    setIsSaving(true);

    try {
      await registerShrinkage({
        ingredientId: shrinkageForm.ingredientId,
        quantity: shrinkageForm.quantity,
        reason: shrinkageForm.reason,
      });

      setShrinkageForm(emptyShrinkage);
      setStatus("Merma registrada y stock actualizado.");
      await loadIngredients();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSaving(false);
    }
  };

  const startEditingIngredient = (ingredient) => {
    clearMessages();
    setEditingIngredientId(ingredient.id);
    setIngredientForm({
      name: ingredient.name,
      unitOfMeasure: ingredient.unitOfMeasure,
      currentStock: toStock(ingredient.currentStock),
    });
  };

  const handleDeleteIngredient = async (ingredient) => {
    clearMessages();

    const shouldDelete = window.confirm(`Eliminar ${ingredient.name}? Si esta ligado a una receta, el sistema lo bloqueara.`);
    if (!shouldDelete) return;

    setIsSaving(true);

    try {
      await deleteIngredient(ingredient.id);
      if (editingIngredientId === ingredient.id) resetIngredientForm();
      setStatus("Ingrediente eliminado correctamente.");
      await loadIngredients();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="inventory-page">
      <header className="inventory-head">
        <div>
          <p className="admin-users-kicker">Inventario</p>
          <h2>Control de insumos y merma</h2>
          <p>Administra ingredientes, stock y perdidas operativas por restaurante.</p>
        </div>
        <button type="button" onClick={loadIngredients} disabled={isLoading}>
          {isLoading ? "Actualizando..." : "Actualizar"}
        </button>
      </header>

      <section className="inventory-summary" aria-label="Resumen de inventario">
        <article>
          <span>Ingredientes</span>
          <strong>{ingredients.length}</strong>
        </article>
        <article>
          <span>Sin stock</span>
          <strong>{lowStockCount}</strong>
        </article>
        <article>
          <span>Modulo</span>
          <strong>Merma</strong>
        </article>
      </section>

      <section className="inventory-layout">
        <div className="inventory-form-stack">
          <form className="inventory-form" onSubmit={handleIngredientSubmit}>
            <div>
              <p className="admin-users-kicker">{editingIngredientId ? "Editar ingrediente" : "Nuevo ingrediente"}</p>
              <h3>{editingIngredientId ? "Actualizar insumo" : "Crear insumo"}</h3>
              <p>Estos ingredientes se usan despues en las recetas de cada producto.</p>
            </div>

            <label>
              <span>Nombre</span>
              <input
                value={ingredientForm.name}
                onChange={(event) => setIngredientForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Ej. Carne de res"
              />
            </label>

            <label>
              <span>Unidad de medida</span>
              <input
                value={ingredientForm.unitOfMeasure}
                onChange={(event) => setIngredientForm((current) => ({ ...current, unitOfMeasure: event.target.value }))}
                placeholder="Ej. lb, kg, unidad, lt"
              />
            </label>

            <label>
              <span>Stock actual</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={ingredientForm.currentStock}
                onChange={(event) => setIngredientForm((current) => ({ ...current, currentStock: event.target.value }))}
                placeholder="Ej. 25.00"
              />
            </label>

            <div className="inventory-form-actions">
              {editingIngredientId ? (
                <button type="button" className="is-secondary" onClick={resetIngredientForm}>
                  Cancelar
                </button>
              ) : null}
              <button type="submit" disabled={isSaving || !ingredientForm.name.trim() || !ingredientForm.unitOfMeasure.trim()}>
                {isSaving ? "Guardando..." : editingIngredientId ? "Guardar cambios" : "Crear ingrediente"}
              </button>
            </div>
          </form>

          <form className="inventory-form" onSubmit={handleShrinkageSubmit}>
            <div>
              <p className="admin-users-kicker">Registrar merma</p>
              <h3>Descontar insumo</h3>
              <p>Usa esta accion cuando un ingrediente se pierde, vence o queda inutilizable.</p>
            </div>

            <label>
              <span>Ingrediente</span>
              <select value={shrinkageForm.ingredientId} onChange={(event) => setShrinkageForm((current) => ({ ...current, ingredientId: event.target.value }))}>
                <option value="">Seleccionar ingrediente</option>
                {ingredients.map((ingredient) => (
                  <option key={ingredient.id} value={ingredient.id}>
                    {ingredient.name} ({toStock(ingredient.currentStock)} {ingredient.unitOfMeasure})
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Cantidad perdida</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={shrinkageForm.quantity}
                onChange={(event) => setShrinkageForm((current) => ({ ...current, quantity: event.target.value }))}
                placeholder="Ej. 2.50"
              />
            </label>
            <label>
              <span>Motivo</span>
              <textarea
                value={shrinkageForm.reason}
                onChange={(event) => setShrinkageForm((current) => ({ ...current, reason: event.target.value }))}
                placeholder="Ej. Producto vencido, dano en cocina, error de preparacion."
              />
            </label>

            {selectedIngredient ? (
              <p className="inventory-selected">
                Stock actual: <strong>{toStock(selectedIngredient.currentStock)} {selectedIngredient.unitOfMeasure}</strong>
              </p>
            ) : null}

            <button type="submit" disabled={isSaving || !shrinkageForm.ingredientId || !shrinkageForm.quantity || !shrinkageForm.reason.trim()}>
              {isSaving ? "Registrando..." : "Registrar merma"}
            </button>

            {status ? <p className="admin-users-success">{status}</p> : null}
            {error ? <p className="admin-users-error">{error}</p> : null}
          </form>
        </div>

        <section className="inventory-table-card">
          <div className="inventory-table-head">
            <div>
              <h3>Ingredientes</h3>
              <p>Stock actual por insumo del restaurante.</p>
            </div>
          </div>

          <div className="inventory-table-wrap">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Ingrediente</th>
                  <th>Unidad</th>
                  <th>Stock actual</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map((ingredient) => {
                  const stock = Number(ingredient.currentStock || 0);
                  return (
                    <tr key={ingredient.id}>
                      <td>{ingredient.name}</td>
                      <td>{ingredient.unitOfMeasure}</td>
                      <td>{toStock(stock)}</td>
                      <td>
                        <span className={stock > 0 ? "inventory-pill is-ok" : "inventory-pill is-empty"}>
                          {stock > 0 ? "Disponible" : "Sin stock"}
                        </span>
                      </td>
                      <td>
                        <div className="inventory-row-actions">
                          <button type="button" onClick={() => startEditingIngredient(ingredient)}>
                            Editar
                          </button>
                          <button type="button" onClick={() => handleDeleteIngredient(ingredient)}>
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {ingredients.length === 0 && !isLoading ? (
            <section className="inventory-empty">
              <strong>No hay ingredientes registrados</strong>
              <p>Crea el primer insumo para poder ligarlo a recetas de productos.</p>
            </section>
          ) : null}
        </section>
      </section>
    </section>
  );
};