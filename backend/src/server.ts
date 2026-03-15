import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
import twilio from "twilio";
import sgMail from "@sendgrid/mail";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

/* =========================
   CONFIG EXTERNAL SERVICES
========================= */

const smsClient = twilio(
    process.env.TWILIO_SID,
    process.env.TWILIO_TOKEN
);

if (process.env.SENDGRID_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_KEY);
}

const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret-in-production";

/* =========================
   AUTH MIDDLEWARE
========================= */

interface AuthRequest extends Request {
    user?: { userId: string; username: string; email: string };
}

function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    try {
        const token = auth.slice(7);
        const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
        req.user = {
            userId: payload.userId,
            username: payload.username,
            email: payload.email
        };
        next();
    } catch {
        res.status(401).json({ message: "Invalid or expired token" });
    }
}

/* =========================
   HEALTH CHECK
========================= */

app.get("/", (_req, res) => {
    res.send("API is running");
});

/* =========================
   AUTH ROUTES
========================= */

// Register
app.post("/auth/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            res.status(400).json({ message: "Username, email and password are required" });
            return;
        }

        if (password.length < 6) {
            res.status(400).json({ message: "Password must be at least 6 characters" });
            return;
        }

        const existing = await prisma.user.findFirst({
            where: { OR: [{ username }, { email }] }
        });

        if (existing) {
            if (existing.username === username) {
                res.status(409).json({ message: "Username already taken" });
            } else {
                res.status(409).json({ message: "Email already registered" });
            }
            return;
        }

        const hashed = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: { username, email, password: hashed, name: username }
        });

        const token = jwt.sign(
            { userId: user.id.toString(), username: user.username, email: user.email },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(201).json({
            token,
            user: { id: user.id.toString(), username: user.username, email: user.email }
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// Login
app.post("/auth/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            res.status(400).json({ message: "Username and password are required" });
            return;
        }

        const user = await prisma.user.findUnique({ where: { username } });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            res.status(401).json({ message: "Invalid username or password" });
            return;
        }

        const token = jwt.sign(
            { userId: user.id.toString(), username: user.username, email: user.email },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            token,
            user: { id: user.id.toString(), username: user.username, email: user.email }
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// Forgot password
app.post("/auth/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400).json({ message: "Email is required" });
            return;
        }

        // Always return success to prevent email enumeration
        const user = await prisma.user.findUnique({ where: { email } });

        if (user) {
            // Invalidate previous tokens
            await prisma.passwordResetToken.updateMany({
                where: { userId: user.id, used: false },
                data: { used: true }
            });

            const rawToken = crypto.randomBytes(32).toString("hex");
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

            await prisma.passwordResetToken.create({
                data: { userId: user.id, token: rawToken, expiresAt }
            });

            const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
            const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;

            if (process.env.SENDGRID_KEY) {
                await sgMail.send({
                    to: email,
                    from: process.env.EMAIL_FROM!,
                    subject: "Reset your password",
                    text: `Click the link below to reset your password. This link is valid for 1 hour.\n\n${resetLink}\n\nIf you did not request this, ignore this email.`,
                    html: `<p>Click the link below to reset your password. This link is valid for 1 hour.</p><p><a href="${resetLink}">${resetLink}</a></p><p>If you did not request this, ignore this email.</p>`
                });
            } else {
                // Dev mode: log link to console instead of sending email
                console.log(`\n[DEV] Password reset link for ${email}:\n${resetLink}\n`);
            }
        }

        res.json({ message: "If that email is registered, a reset link has been sent." });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// Reset password
app.post("/auth/reset-password", async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            res.status(400).json({ message: "Token and password are required" });
            return;
        }

        if (password.length < 6) {
            res.status(400).json({ message: "Password must be at least 6 characters" });
            return;
        }

        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token }
        });

        if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
            res.status(400).json({ message: "Reset link is invalid or has expired" });
            return;
        }

        const hashed = await bcrypt.hash(password, 12);

        await prisma.user.update({
            where: { id: resetToken.userId },
            data: { password: hashed }
        });

        await prisma.passwordResetToken.update({
            where: { id: resetToken.id },
            data: { used: true }
        });

        res.json({ message: "Password has been reset successfully" });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// Get current user
app.get("/auth/me", authMiddleware, (req: AuthRequest, res) => {
    res.json({ user: req.user });
});

/* =========================
   CUSTOMER ROUTES
========================= */

app.get("/customers", authMiddleware, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.userId;

        const customers = await prisma.customer.findMany({
            where: { userId: BigInt(userId) },
            orderBy: { createdAt: "desc" }
        });

        res.json(customers);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

app.post("/customers", authMiddleware, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.userId;
        const { name, address, phone, email } = req.body;

        const newCustomer = await prisma.customer.create({
            data: {
                userId: BigInt(userId),
                name,
                address,
                phone,
                email
            }
        });

        res.status(201).json(newCustomer);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

app.put("/customers/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
        const id = BigInt(req.params.id as string);
        const userId = req.user!.userId;
        const { name, address, phone, email } = req.body;

        // Verify ownership
        const customer = await prisma.customer.findUnique({ where: { id } });
        if (!customer || customer.userId !== BigInt(userId)) {
            res.status(403).json({ message: "Forbidden" });
            return;
        }

        const updated = await prisma.customer.update({
            where: { id },
            data: { name, address, phone, email }
        });

        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

app.delete("/customers/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
        const id = BigInt(req.params.id as string);
        const userId = req.user!.userId;

        // Verify ownership
        const customer = await prisma.customer.findUnique({ where: { id } });
        if (!customer || customer.userId !== BigInt(userId)) {
            res.status(403).json({ message: "Forbidden" });
            return;
        }

        await prisma.customer.delete({ where: { id } });

        res.json({ message: "Deleted" });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

/* =========================
   SEND COMMUNICATION
========================= */

app.post("/send", authMiddleware, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.userId;
        const { customerId, type, to, subject, message } = req.body;

        // Verify customer belongs to user
        const customer = await prisma.customer.findUnique({
            where: { id: BigInt(customerId) }
        });
        if (!customer || customer.userId !== BigInt(userId)) {
            res.status(403).json({ message: "Forbidden" });
            return;
        }

        let result;

        if (type === "SMS") {
            if (process.env.TWILIO_SID && process.env.TWILIO_TOKEN) {
                result = await smsClient.messages.create({
                    body: message,
                    from: process.env.TWILIO_PHONE,
                    to
                });
            } else {
                console.log(`[DEV] SMS to ${to}: ${message}`);
                result = { sid: "dev-mock-sid" };
            }
        }

        if (type === "EMAIL") {
            if (process.env.SENDGRID_KEY) {
                result = await sgMail.send({
                    to,
                    from: process.env.EMAIL_FROM!,
                    subject,
                    text: message
                });
            } else {
                console.log(`[DEV] Email to ${to} | Subject: ${subject} | Body: ${message}`);
                result = { messageId: "dev-mock-email" };
            }
        }

        const log = await prisma.communicationLog.create({
            data: {
                userId: BigInt(userId),
                customerId: BigInt(customerId),
                type,
                subject,
                message,
                status: "SENT",
                sentAt: new Date()
            }
        });

        res.json({ success: true, log, result });
    } catch (error: any) {
        console.error(error);

        await prisma.communicationLog.create({
            data: {
                userId: BigInt(req.user!.userId),
                customerId: BigInt(req.body.customerId),
                type: req.body.type,
                subject: req.body.subject,
                message: req.body.message,
                status: "FAILED"
            }
        });

        res.status(500).json({ success: false, message: error.message });
    }
});

/* =========================
   LOG ROUTES
========================= */

app.get("/logs", authMiddleware, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.userId;
        const customerId = req.query.customerId as string;

        const where: any = { userId: BigInt(userId) };
        if (customerId) where.customerId = BigInt(customerId);

        const logs = await prisma.communicationLog.findMany({
            where,
            include: { customer: true },
            orderBy: { createdAt: "desc" }
        });

        res.json(logs);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});