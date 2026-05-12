import { z } from "zod";

export const createProductSchema = z.object({
    name: z.string().min(1, "El nombre no puede estar vacío").max(120),
    description: z.string().min(1, "La descripción es obligatoria"),
    categoryId: z.string().uuid("El ID de la categoría debe ser un UUID válido"),
    price: z.coerce.number().positive("El precio debe ser mayor a 0") 
});

export const createComboSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    description: z.string().min(1, "La descripción es obligatoria"),
    price: z.coerce.number().positive("El precio debe ser válido"),
    items: z.array(
        z.object({
            productId: z.string().uuid("ID de producto inválido"),
            quantity: z.number().int().min(1, "La cantidad debe ser al menos 1")
        })
    ).min(1, "El combo debe tener al menos un producto")
});

export const createOrderSchema = z.object({
    fulfillmentType: z.enum(["takeaway", "dine_in"], {
        errorMap: () => ({ message: "Tipo de entrega inválido" })
    }),
    tableIdentifier: z.string().optional(),
    items: z.array(
        z.object({
            itemType: z.enum(["product", "combo"]),
            itemId: z.string().uuid(),
            quantity: z.number().int().min(1)
        })
    ).min(1, "El pedido no puede estar vacío")
}).refine((data) => {
    if (data.fulfillmentType === "dine_in" && (!data.tableIdentifier || data.tableIdentifier.trim() === "")) {
        return false;
    }
    return true;
}, {
    message: "Debes ingresar el número de mesa para consumo en el local",
    path: ["tableIdentifier"]
});

export const createShrinkageSchema = z.object({
    ingredientId: z.string().uuid("ID de ingrediente inválido"),
    quantity: z.coerce.number().positive("La cantidad debe ser mayor a 0"),
    reason: z.string().min(5, "Debes proveer un motivo detallado")
});