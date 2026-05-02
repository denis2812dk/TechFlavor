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
    user: {
        additionalFields: {
            dui: { type: "string" },
            phone: { type: "string" },
            address: { type: "string", required: false }, 
            isNurse: { type: "boolean" },
            jvpm: { type: "string", required: false },
            jvpe: { type: "string", required: false }, 
            hiringDate: { type: "date" },
        }
    },
    advanced: {
        cookieDomain: ".marioalabi.com", 
    },
    plugins: [
        admin({
            defaultRole: ROLES.ASSISTANT,
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
            await resend.emails.send({
                from: emailFrom,
                to: user.email,
                subject: "Reset your password",
                text: `Click the link to reset your password: ${url}`,
            }).catch((err) => console.error("Failed to send reset password email:", err));
        },
    },
    emailVerification: {
        sendVerificationEmail: async ({ user, url }) => {
            resend.emails.send({
                from: emailFrom,
                to: user.email,
                subject: "Verify your email address",
                text: `Click the link to verify your email: ${url}`,
            }).catch((err) => console.error("Failed to send verification email:", err));
        },
        sendOnSignUp: true,
    },
    trustedOrigins: (process.env.APP_ALLOWED_ORIGINS || "http://localhost:5173").split(","),
    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
});
