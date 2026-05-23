import { Router } from "express";
import { registerRestaurantRequest } from "../controllers/publicController.js";

const router = Router();
router.post("/register", registerRestaurantRequest);

export default router;