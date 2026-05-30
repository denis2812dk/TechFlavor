import { Router } from "express";
import { registerRestaurantRequest } from "../controllers/publicController.js";
import { criticalLimiter } from "../middleware/rateLimiter.js";

const router = Router();
router.post("/register", criticalLimiter, registerRestaurantRequest);

export default router;