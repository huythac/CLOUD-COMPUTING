import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();

/* ===============================
   MIDDLEWARE
================================ */

app.use(
    cors({
        origin: "http://localhost:5173", // frontend vite
    })
);

app.use(express.json());

/* ===============================
   FIX BIGINT JSON ERROR
================================ */

app.use((req, res, next) => {
    const oldJson = res.json;

    res.json = function (data) {
        return oldJson.call(
            this,
            JSON.parse(
                JSON.stringify(data, (_, value) =>
                    typeof value === "bigint" ? value.toString() : value
                )
            )
        );
    };

    next();
});

/* ===============================
   ROUTES
================================ */

/**
 * GET ALL CUSTOMERS
 * GET /api/customers?userId=1
 */
app.get("/api/customers", async (req, res) => {
    try {
        const userId = Number(req.query.userId || 1);

        const customers = await prisma.customer.findMany({
            where: {
                user_id: BigInt(userId),
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        res.json(customers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching customers" });
    }
});

/**
 * CREATE CUSTOMER
 * POST /api/customers
 */
app.post("/api/customers", async (req, res) => {
    try {
        const { user_id, name, address, phone, email } = req.body;

        const newCustomer = await prisma.customer.create({
            data: {
                user_id: BigInt(user_id),
                name,
                address,
                phone,
                email,
            },
        });

        res.status(201).json(newCustomer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating customer" });
    }
});

/**
 * UPDATE CUSTOMER
 * PUT /api/customers/:id
 */
app.put("/api/customers/:id", async (req, res) => {
    try {
        const id = BigInt(req.params.id);
        const { name, address, phone, email } = req.body;

        const updatedCustomer = await prisma.customer.update({
            where: { id },
            data: {
                name,
                address,
                phone,
                email,
            },
        });

        res.json(updatedCustomer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating customer" });
    }
});

/**
 * DELETE CUSTOMER
 * DELETE /api/customers/:id
 */
app.delete("/api/customers/:id", async (req, res) => {
    try {
        const id = BigInt(req.params.id);

        await prisma.customer.delete({
            where: { id },
        });

        res.json({ message: "Customer deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting customer" });
    }
});

/* ===============================
   SERVER
================================ */

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});