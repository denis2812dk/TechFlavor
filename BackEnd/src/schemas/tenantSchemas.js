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
    tableId: z.string().nullable().optional(),
    promoCode: z.string().min(1).max(30).optional(),
    paymentMethod: z.enum(["cash", "card", "transfer"]).optional(),
    customerName: z.string().max(120).optional().nullable(),
    items: z.array(
        z.object({
            itemType: z.enum(["product", "combo"]),
            itemId: idSchema,
            quantity: z.coerce.number().int().min(1),
        }),
    ).min(1, "El pedido no puede estar vacio"),
}).refine((data) => {
    if (data.fulfillmentType === "dine_in" && (!data.tableId || data.tableId.trim() === "")) {
        return false;
    }
    return true;
}, {
    message: "Debes ingresar el numero de mesa para consumo en el local",
    path: ["tableId"],
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
            quantity: z.coerce.number().int().positive("La cantidad debe ser un número entero mayor a 0"),
        }),
    ).min(1, "La receta debe tener al menos un ingrediente"),
});

export const createPromotionSchema = z.object({
    code: z.string().min(3, "El código debe tener al menos 3 caracteres").max(30), 
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
            targetId: z.string().optional().nullable() 
        })
    ).min(1, "La promoción debe aplicar al menos a un producto, categoría o a todo el menú")
}).refine(data => new Date(data.startDate) < new Date(data.endDate), {
    message: "La fecha de finalización debe ser posterior a la fecha de inicio",
    path: ["endDate"]
});

export const createSupplierSchema = z.object({
    name: z.string().min(1, "La Razón Social / Marca es obligatoria").max(150),
    contactName: z.string().max(150).optional().nullable().or(z.literal("")),
    dui: z.string().regex(/^\d{8}-\d$/, "El DUI debe tener el formato 00000000-0"),
    nit: z.string().regex(/^\d{4}-\d{6}-\d{3}-\d$/, "El NIT debe tener el formato 0000-000000-000-0").optional().nullable().or(z.literal('')),
    phone: z.string().max(20).optional().nullable().or(z.literal("")),
    email: z.string().email("Correo electrónico inválido").max(100).optional().nullable().or(z.literal('')),
    address: z.string().max(300).optional().nullable().or(z.literal("")),
});

export const updateSupplierSchema = createSupplierSchema.partial().extend({
    isActive: z.boolean().optional()
});

export const updateCatalogSchema = z.object({
    items: z.array(
        z.object({
            ingredientId: z.string().optional().nullable(),
            ingredientName: z.string().optional().nullable(),
            unitOfMeasure: z.string().optional().nullable(),
            priceReference: z.coerce.number().positive("El precio debe ser positivo").optional().nullable(),
            isPreferred: z.boolean().optional().default(false)
        })
    ).default([])
}).refine((data) => {
    return data.items.every(item => 
        (item.ingredientId && item.ingredientId.trim() !== "") || 
        (item.ingredientName && item.ingredientName.trim() !== "" && item.unitOfMeasure && item.unitOfMeasure.trim() !== "")
    );
}, { 
    message: "Cada insumo del catálogo debe tener un ID existente, o bien, un Nombre y Unidad de Medida para crearlo." 
});

export const createIncidenceSchema = z.object({
    description: z.string().min(5, "La descripción debe tener al menos 5 caracteres."),
    purchaseOrderId: z.string().min(1, "Debes seleccionar una compra relacionada.")
});

export const resolveIncidenceSchema = z.object({
    notes: z.string().min(5, "Debes detallar la resolución de la incidencia."),
    action: z.enum(["SOLO_NOTA", "DEVOLUCION", "DESCUENTO_FUTURO"], {
        errorMap: () => ({ message: "Acción de resolución inválida." })
    }),
    ingredientId: z.string().optional().nullable(),
    quantityToDeduct: z.coerce.number().positive("La cantidad a deducir debe ser mayor a 0").optional().nullable()
}).refine((data) => {
    if (data.action === "DEVOLUCION") {
        return data.ingredientId && data.quantityToDeduct;
    }
    return true;
}, {
    message: "Para una devolución de producto, debes especificar el ID del ingrediente y la cantidad a descontar del inventario.",
    path: ["quantityToDeduct"]
});

export const updateRestaurantSettingsSchema = z.object({
    restaurantName: z.string().min(1).max(120).optional(),
    logoBase64: z.string()
        .max(7 * 1024 * 1024, "El logo codificado no puede exceder los 7MB") // 5MB + margen de Base64
        .refine((val) => val === "" || val.startsWith("data:image/"), {
            message: "El logo debe ser una cadena Base64 válida (data:image/...)"
        }).optional().nullable(),
    currency: z.string().max(10).optional(),
    timezone: z.string().max(80).optional(),
    taxRate: z.coerce.number().min(0).optional(),
    primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
    allowDelivery: z.boolean().optional(),
    allowInventory: z.boolean().optional(),
    notes: z.string().optional().nullable(),
});
export const createPurchaseOrderSchema = z.object({
    supplierId: idSchema,
    items: z.array(
        z.object({
            ingredientId: idSchema,
            quantity: z.coerce.number().positive("La cantidad a comprar debe ser mayor a 0"),
            unitPrice: z.coerce.number().min(0, "El precio unitario no puede ser negativo")
        })
    ).min(1, "La orden de compra debe tener al menos un producto.")
});
export const openShiftSchema = z.object({
    initialBalance: z.coerce.number().min(0, "El fondo inicial no puede ser negativo")
});

export const createMovementSchema = z.object({
    type: z.enum(["IN", "OUT"], { errorMap: () => ({ message: "El tipo debe ser IN o OUT" }) }),
    amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
    reason: z.string().min(5, "Debes justificar el movimiento detalladamente")
});

export const closeShiftSchema = z.object({
    declaredCash: z.coerce.number().min(0, "El efectivo no puede ser negativo"),
    declaredCard: z.coerce.number().min(0, "El monto en tarjeta no puede ser negativo"),
    declaredTransfer: z.coerce.number().min(0, "El monto en transferencia no puede ser negativo"),
    notes: z.string().optional().nullable()
});
