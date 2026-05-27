import { Router } from "express";
import { ROLES } from "../constants/roles.js";
import { 
    listSuppliers, 
    createSupplier, 
    updateSupplier, 
    deleteSupplier,
    setSupplierCatalog,
    listIncidences,           
    addIncidence,             
    resolveSupplierIncidence  
} from "../controllers/tenantSupplierController.js";
import { requireTenantRoles } from "../middleware/tenantAuthorization.js";
import { tenantContext } from "../middleware/tenantContext.js";
import { validateRequest } from "../middleware/validateSchema.js";
import { 
    createSupplierSchema, 
    updateSupplierSchema, 
    updateCatalogSchema, 
    createIncidenceSchema, 
    resolveIncidenceSchema 
} from "../schemas/tenantSchemas.js";

const router = Router();

router.use(tenantContext, requireTenantRoles(ROLES.GERENTE));

router.get("/", listSuppliers);
router.post("/", validateRequest(createSupplierSchema), createSupplier);
router.patch("/:supplierId", validateRequest(updateSupplierSchema), updateSupplier);
router.delete("/:supplierId", deleteSupplier);
router.put("/:supplierId/catalog", validateRequest(updateCatalogSchema), setSupplierCatalog);

router.get("/:supplierId/incidences", listIncidences);
router.post("/:supplierId/incidences", validateRequest(createIncidenceSchema), addIncidence);
router.patch("/:supplierId/incidences/:incidenceId/resolve", validateRequest(resolveIncidenceSchema), resolveSupplierIncidence);

export default router;