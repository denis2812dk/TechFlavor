import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";
import { auth } from "./config/auth.js";
import { errorHandler } from "./middleware/errorHandler.js";
import tenantRoutes from "./router/tenantRoutes.js";
import publicRoutes from "./router/publicRoutes.js";
import saasRoutes from "./router/saasRoutes.js";
import tenantTableRoutes from "./router/tenantTableRoutes.js";
import tenantSupplierRoutes from "./router/tenantSupplierRoutes.js";
import tenantPurchaseOrderRoutes from "./router/tenantPurchaseOrderRoute.js";
import tenantCashRoutes from "./router/tenantCashRoutes.js";
import "dotenv/config";
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const allowedOrigins = process.env.APP_ALLOWED_ORIGINS
    ? process.env.APP_ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : ["http://localhost:5173", "http://127.0.0.1:5173"];

    
app.use(cors({
        origin: allowedOrigins,
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH","DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use("/api/public", publicRoutes);
app.use("/api/saas", saasRoutes);
app.use("/api/auth", toNodeHandler(auth));
app.use("/api/tenant/suppliers", tenantSupplierRoutes);
app.use("/api/tenant", tenantRoutes);
app.use("/api/tenant/tables", tenantTableRoutes);
app.use("/api/tenant/purchases", tenantPurchaseOrderRoutes);
app.use("/api/tenant/cash", tenantCashRoutes);
app.get("/status", (req, res) => {
    res.json({
        status: "ok",
        message: "TechFlavor server active",
        timestamp: new Date().toISOString()
    });
});

app.use(errorHandler);

export default app;
