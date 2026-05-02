import 'dotenv/config';
import app from "../app.js";
import { connectDB } from "./db.js";

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Clinic server running at: http://localhost:${PORT}`);
    });
};

startServer();

