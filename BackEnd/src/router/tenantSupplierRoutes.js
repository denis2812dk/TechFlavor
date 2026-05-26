import { Router } from "express";
import { ROLES } from "../constants/roles.js";
import { listSuppliers, createSupplier, updateSupplier, deleteSupplier,setSupplierCatalog} from "../controllers/tenantSupplierController.js";
import { requireTenantRoles } from "../middleware/tenantAuthorization.js";
import { tenantContext } from "../middleware/tenantContext.js";

const router = Router();
router.use(tenantContext, requireTenantRoles(ROLES.GERENTE));

router.get("/", listSuppliers);
router.post("/", createSupplier);
router.patch("/:supplierId", updateSupplier);
router.delete("/:supplierId", deleteSupplier);
router.put("/:supplierId/catalog", setSupplierCatalog);

export default router;