import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { Resend } from "resend";
import { db } from "./db.js";
import * as schema from "../models/schema.js";
import { ROLES } from "../constants/roles.js";
import 'dotenv/config'


const resend = new Resend(process.env.RESEND_API_KEY);
const emailFrom = process.env.RESEND_EMAIL_FROM || "no-reply@example.com";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "mysql",
        schema: {
            user: schema.users,
            session: schema.sessions,
            account: schema.accounts,
            verification: schema.verifications,
            rateLimit: schema.rateLimit,
        }
    }),
    plugins: [
        admin({
            defaultRole: ROLES.OPERADOR,
        }),
    ],
    session: {
        expiresIn: 60 * 60 * 12,
        updateAge: 60 * 60 * 1,
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60
        }
    },
    rateLimit: {
        enabled: true,
        storage: "database",
        window: 60,
        max: 100,
    },
    emailAndPassword: {
        enabled: true,
        sendResetPassword: async ({ user, url }) => {
            console.log(`Enviando reset a ${user.email} desde ${emailFrom}`);
            try {
                const { data, error } = await resend.emails.send({
                    from: emailFrom,
                    to: user.email,
                    subject: "Restablecer contraseña de TechFlavor",
                    html: `
                      <div style="font-family: Arial, sans-serif; color: #333; max-width: 500px;">
                        <h2>Hola, ${user.name}</h2>
                        <p>Recibimos una solicitud para restablecer tu contraseña. Si fuiste tú, haz clic en el botón de abajo para asignar una nueva:</p>
                        <a href="${url}" style="display: inline-block; padding: 12px 20px; background-color: #ea580c; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">
                          Restablecer mi contraseña
                        </a>
                        <p style="margin-top: 20px; font-size: 13px; color: #666;">Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
                      </div>
                    `,
                });

                if (error) {
                    console.error("❌ Error de Resend al enviar el correo:", error);
                    return;
                }
                console.log("✅ Correo enviado con éxito por Resend. ID:", data?.id);
            } catch (err) {
                console.error("❌ Excepción inesperada ejecutando Resend:", err);
            }
        },
    },
    emailVerification: {
        sendVerificationEmail: async ({ user, url }) => {
            try {
                const { data, error } = await resend.emails.send({
                    from: emailFrom,
                    to: user.email,
                    subject: "Verify your email address",
                    text: `Click the link to verify your email: ${url}`,
                });
                if (error) console.error("❌ Error de Resend verificando email:", error);
                else console.log("✅ Correo de verificación enviado. ID:", data?.id);
            } catch (err) {
                console.error("❌ Excepción inesperada ejecutando Resend:", err);
            }
        },
        sendOnSignUp: true,
    },
    trustedOrigins: (process.env.APP_ALLOWED_ORIGINS || "http://localhost:5173").split(","),
    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
});
