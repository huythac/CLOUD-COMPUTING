import express from "express";
import { PrismaClient } from "@prisma/client";
import cors from "cors";

(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

const app = express();
const prisma = new PrismaClient();

app.use(cors()); // THÊM DÒNG NÀY ĐỂ FRONTEND KHÔNG BỊ LỖI
app.use(express.json());

app.get("/", (req, res) => {
    res.send("API is running");
});

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
        // In lỗi ra terminal EC2 để dễ debug
        console.error("Lỗi lấy danh sách:", error);
        res.status(500).json({ message: "Error fetching customers", error: error.message });
    }
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
    } catch (error: any) {
        console.error("Lỗi POST:", error); // In ra terminal EC2
        res.status(500).json({ message: "Error creating customer", detail: error.message });
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

app.listen(80, () => {
    console.log("Server running on http://localhost:80");
});


