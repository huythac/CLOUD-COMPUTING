import express from "express";
import { PrismaClient } from "@prisma/client";
import cors from "cors";

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

/**
 * HEALTH CHECK
 */
app.get("/", (req, res) => {
    res.send("API is running");
});

/**
 * GET ALL CUSTOMERS
 * GET /customers?userId=1
 */
// app.get("/customers", async (req, res) => {
//     try {
//         const userId = BigInt(req.query.userId as string);

//         const customers = await prisma.customer.findMany({
//             where: { userId: BigInt(userId) },
//             orderBy: { createdAt: "desc" }
//         });

//         res.json(customers);
//     } catch (error) {
//         res.status(500).json({ message: "Error fetching customers" });
//     }
// });
app.get("/customers", async (req, res) => {
    const customers = await prisma.customer.findMany();
    res.json(customers);
});

/**
 * CREATE CUSTOMER
 * POST /customers
 */
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
    } catch (error) {
        res.status(500).json({ message: "Error creating customer" });
    }
});

/**
 * UPDATE CUSTOMER
 * PUT /customers/:id
 */
app.put("/customers/:id", async (req, res) => {
    try {
        const id = BigInt(req.params.id);
        const { name, address, phone, email } = req.body;

        const updatedCustomer = await prisma.customer.update({
            where: { id },
            data: {
                name,
                address,
                phone,
                email
            }
        });

        res.json(updatedCustomer);
    } catch (error) {
        res.status(500).json({ message: "Error updating customer" });
    }
});

/**
 * DELETE CUSTOMER
 * DELETE /customers/:id
 */
app.delete("/customers/:id", async (req, res) => {
    try {
        const id = BigInt(req.params.id);

        await prisma.customer.delete({
            where: { id }
        });

        res.json({ message: "Customer deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting customer" });
    }
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});


