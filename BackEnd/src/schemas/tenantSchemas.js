import { z } from "zod";

const idSchema = z.string().min(1, "El ID es obligatorio").max(36, "El ID no puede exceder 36 caracteres");

export const createProductSchema = z.object({
    name: z.string().min(1, "El nombre no puede estar vacio").max(120),
    description: z.string().min(1, "La descripcion es obligatoria"),
    categoryId: idSchema,
    price: z.coerce.number().positive("El precio debe ser mayor a 0"),
});

export const createComboSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    description: z.string().min(1, "La descripcion es obligatoria"),
    price: z.coerce.number().positive("El precio debe ser valido"),
    items: z.array(
        z.object({
            productId: idSchema,
            quantity: z.coerce.number().int().min(1, "La cantidad debe ser al menos 1"),
        }),
    ).min(1, "El combo debe tener al menos un producto"),
});

export const createOrderSchema = z.object({
    fulfillmentType: z.enum(["takeaway", "dine_in"], {
        errorMap: () => ({ message: "Tipo de entrega invalido" }),
    }),
    tableIdentifier: z.string().nullable().optional(),
    items: z.array(
        z.object({
            itemType: z.enum(["product", "combo"]),
            itemId: idSchema,
            quantity: z.coerce.number().int().min(1),
        }),
    ).min(1, "El pedido no puede estar vacio"),
}).refine((data) => {
    if (data.fulfillmentType === "dine_in" && (!data.tableIdentifier || data.tableIdentifier.trim() === "")) {
        return false;
    }
    return true;
}, {
    message: "Debes ingresar el numero de mesa para consumo en el local",
    path: ["tableIdentifier"],
});

export const createShrinkageSchema = z.object({
    ingredientId: idSchema,
    quantity: z.coerce.number().positive("La cantidad debe ser mayor a 0"),
    reason: z.string().min(5, "Debes proveer un motivo detallado"),
});

export const updateRecipeSchema = z.object({
    ingredients: z.array(
        z.object({
            ingredientId: idSchema,
            quantity: z.coerce.number().positive("La cantidad debe ser mayor a 0"),
        }),
    ).min(1, "La receta debe tener al menos un ingrediente"),
});
export const createPromotionSchema = z.object({
    name: z.string().min(1, "El nombre de la promoción es obligatorio").max(120),
    description: z.string().optional(),
    discountType: z.enum(["percentage", "fixed_amount"], {
        errorMap: () => ({ message: "El tipo de descuento debe ser porcentaje o monto fijo" })
    }),
    discountValue: z.coerce.number().positive("El valor del descuento debe ser mayor a 0"),
    startDate: z.string().datetime({ message: "Formato de fecha de inicio inválido (ISO-8601 esperado)" }),
    endDate: z.string().datetime({ message: "Formato de fecha de fin inválido (ISO-8601 esperado)" }),
    isActive: z.boolean().optional().default(true),
    targets: z.array(
        z.object({
            targetType: z.enum(["product", "category", "all"]),
            targetId: z.string().uuid("El ID del objetivo debe ser válido").optional().nullable()
        })
    ).min(1, "La promoción debe aplicar al menos a un producto, categoría o a todo el menú")
}).refine(data => new Date(data.startDate) < new Date(data.endDate), {
    message: "La fecha de finalización debe ser posterior a la fecha de inicio",
    path: ["endDate"]
});