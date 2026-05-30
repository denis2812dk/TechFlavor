import { Router } from "express";
import { registerRestaurantRequest } from "../controllers/publicController.js";
import { criticalLimiter } from "../middleware/rateLimiter.js";
import { listPublicSaasPlans } from "../controllers/saasController.js";
const router = Router();
router.get("/plans", listPublicSaasPlans);
router.post("/register", criticalLimiter, registerRestaurantRequest);

export default router;