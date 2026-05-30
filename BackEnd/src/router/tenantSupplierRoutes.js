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
import { readLimiter, writeLimiter } from "../middleware/rateLimiter.js";
import { 
    createSupplierSchema, 
    updateSupplierSchema, 
    updateCatalogSchema, 
    createIncidenceSchema, 
    resolveIncidenceSchema 
} from "../schemas/tenantSchemas.js";

const router = Router();

router.use(tenantContext, requireTenantRoles(ROLES.GERENTE));

router.get("/", readLimiter, listSuppliers);
router.post("/", writeLimiter, validateRequest(createSupplierSchema), createSupplier);
router.patch("/:supplierId", writeLimiter, validateRequest(updateSupplierSchema), updateSupplier);
router.delete("/:supplierId", writeLimiter, deleteSupplier);
router.put("/:supplierId/catalog", writeLimiter, validateRequest(updateCatalogSchema), setSupplierCatalog);

router.get("/:supplierId/incidences", readLimiter, listIncidences);
router.post("/:supplierId/incidences", writeLimiter, validateRequest(createIncidenceSchema), addIncidence);
router.patch("/:supplierId/incidences/:incidenceId/resolve", writeLimiter, validateRequest(resolveIncidenceSchema), resolveSupplierIncidence);

export default router;