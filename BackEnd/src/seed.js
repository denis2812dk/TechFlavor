import "dotenv/config";
import { auth } from "./config/auth.js";
import { connectDB } from "./Config/db.js";
import { ROLES } from "./constants/roles.js";

const createUsers = async () => {
  try {
    console.log("Starting restaurant data seeding...");
    await connectDB();

    const usersToCreate = [
      {
        email: "admin@techflavor.com",
        password: "AdminPassword123!",
        name: "Administrador General",
        role: ROLES.ADMIN,
      },
      {
        email: "operador@techflavor.com",
        password: "OperadorPassword123!",
        name: "Operador General",
        role: ROLES.OPERADOR,
      },
      {
        email: "cajero@techflavor.com",
        password: "CajeroPassword123!",
        name: "Caja Principal",
        role: ROLES.CAJERO,
      },
      {
        email: "cocina@techflavor.com",
        password: "CocinaPassword123!",
        name: "Equipo de Cocina",
        role: ROLES.COCINA,
      },
      {
        email: "despacho@techflavor.com",
        password: "DespachoPassword123!",
        name: "Área de Despacho",
        role: ROLES.DESPACHO,
      },
    ];

    for (const user of usersToCreate) {
      console.log(`Creating user: ${user.email}...`);

      await auth.api.createUser({
        body: {
          email: user.email,
          password: user.password,
          name: user.name,
          role: user.role,
        },
      });
    }

    console.log("Restaurant seeding completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
};

createUsers();
