import "dotenv/config";
import { eq } from "drizzle-orm";
import { auth } from "./config/auth.js";
import { connectDB, db } from "./config/db.js";
import { ROLES } from "./constants/roles.js";
import { users } from "./models/schema.js";

const SUPER_ADMIN = {
  email: "admin@techflavor.com",
  password: "AdminPassword123!",
  name: "Super Administrador",
  role: ROLES.ADMIN,
};

const ensureSuperAdmin = async () => {
  console.log(`Buscando usuario administrador: ${SUPER_ADMIN.email}...`);

  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, SUPER_ADMIN.email))
    .limit(1);

  if (existingUser) {
    console.log("✅ El Super Administrador ya existe en el sistema.");
    return;
  }

  console.log("Creando nuevo Super Administrador...");
  
  await auth.api.createUser({
    body: {
      email: SUPER_ADMIN.email,
      password: SUPER_ADMIN.password,
      name: SUPER_ADMIN.name,
      role: SUPER_ADMIN.role,
    },
  });

  console.log("✅ Super Administrador creado exitosamente.");
};

const seed = async () => {
  try {
    console.log("====================================");
    console.log("Inicializando TechFlavor SaaS Core");
    console.log("====================================");
    
    await connectDB();
    await ensureSuperAdmin();

    console.log("====================================");
    console.log(`Base de datos central: ${process.env.DB_NAME}`);
    console.log("Seed completado. Plataforma lista.");
    process.exit(0);
  } catch (error) {
    console.error("Error durante la inicialización (Seeding):", error);
    process.exit(1);
  }
};

seed();