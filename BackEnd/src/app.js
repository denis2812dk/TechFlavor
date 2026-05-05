import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";
import { auth } from "./config/auth.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

const allowedOrigins = process.env.APP_ALLOWED_ORIGINS
    ? process.env.APP_ALLOWED_ORIGINS.split(',')
    : ["http://localhost:5173"];

    
app.use(cors({
        origin: allowedOrigins,
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH","DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"]
}));

app.all("/api/auth/*splat", toNodeHandler(auth));


app.get("/status", (req, res) => {
    res.json({
        status: "ok",
        message: "Clinic server active",
        timestamp: new Date().toISOString()
    });
});

app.use(errorHandler);

export default app;