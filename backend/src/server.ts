import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
import twilio from "twilio";
import sgMail from "@sendgrid/mail";

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

sgMail.setApiKey(process.env.SENDGRID_KEY!);

/* =========================
   HEALTH CHECK
========================= */

app.get("/", (req, res) => {
    res.send("API is running");
});

/* =========================
   CUSTOMER ROUTES
========================= */

app.get("/customers", async (req, res) => {
    try {
        const userId = req.query.userId as string;

        let customers;

        if (userId) {
            customers = await prisma.customer.findMany({
                where: { userId: BigInt(userId) },
                orderBy: { createdAt: "desc" }
            });
        } else {
            customers = await prisma.customer.findMany();
        }

        res.json(customers);

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});


app.post("/customers", async (req, res) => {
    try {
        const { userId, name, address, phone, email } = req.body;

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


app.put("/customers/:id", async (req, res) => {
    try {
        const id = BigInt(req.params.id);
        const { name, address, phone, email } = req.body;

        const updated = await prisma.customer.update({
            where: { id },
            data: { name, address, phone, email }
        });

        res.json(updated);

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});


app.delete("/customers/:id", async (req, res) => {
    try {
        const id = BigInt(req.params.id);

        await prisma.customer.delete({
            where: { id }
        });

        res.json({ message: "Deleted" });

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

/* =========================
   SEND COMMUNICATION
========================= */

app.post("/send", async (req, res) => {
    try {
        const { userId, customerId, type, to, subject, message } = req.body;

        let result;

        if (type === "SMS") {
            result = await smsClient.messages.create({
                body: message,
                from: process.env.TWILIO_PHONE,
                to
            });
        }

        if (type === "EMAIL") {
            result = await sgMail.send({
                to,
                from: process.env.EMAIL_FROM!,
                subject,
                text: message
            });
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

        res.json({
            success: true,
            log,
            result
        });

    } catch (error: any) {

        console.error(error);

        await prisma.communicationLog.create({
            data: {
                userId: BigInt(req.body.userId),
                customerId: BigInt(req.body.customerId),
                type: req.body.type,
                subject: req.body.subject,
                message: req.body.message,
                status: "FAILED"
            }
        });

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/* =========================
   LOG ROUTES
========================= */

app.get("/logs", async (req, res) => {
    try {
        const customerId = req.query.customerId as string;

        const logs = await prisma.communicationLog.findMany({
            where: customerId
                ? { customerId: BigInt(customerId) }
                : {},
            include: {
                customer: true
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        res.json(logs);

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});


app.listen(3000, () => {
    console.log("Server running on port 3000");
});