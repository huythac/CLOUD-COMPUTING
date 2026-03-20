import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
//import twilio from "twilio";
import sgMail from "@sendgrid/mail";
import crypto from 'crypto';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'cloud_computing_2026';

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

// const smsClient = twilio(
//     process.env.TWILIO_SID,
//     process.env.TWILIO_TOKEN
// );

sgMail.setApiKey(process.env.SENDGRID_KEY!);

/* =========================
   HEALTH CHECK
========================= */

app.get("/", (req, res) => {
    res.send("API is running");
});

/* =========================
   AUTHENTICATION ROUTES
========================= */

// 1. Đăng ký (Register)
app.post("/api/auth/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Kiểm tra xem email đã tồn tại chưa
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Email đã được sử dụng" });
        }

        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // Lưu user mới vào DB
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });

        res.status(201).json({
            success: true,
            message: "Đăng ký thành công",
            user: {
                id: newUser.id.toString(),
                name: newUser.name,
                email: newUser.email
            }
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
});


// 2. Đăng nhập (Login)
app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Tìm user theo email
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không đúng" });
        }

        // So sánh mật khẩu
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không đúng" });
        }

        // Tạo Token
        const token = jwt.sign(
            { userId: user.id.toString(), email: user.email },
            JWT_SECRET,
            { expiresIn: "24h" }
        );

        res.json({
            success: true,
            message: "Đăng nhập thành công",
            token,
            user: {
                id: user.id.toString(),
                name: user.name,
                email: user.email
            }
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
});

// 3. Quên mật khẩu (Forgot Password)
app.post("/api/auth/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;

        // Tìm user
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({ success: false, message: "Không tìm thấy tài khoản với email này" });
        }

        // Tạo mã token ngẫu nhiên (sống trong 1 giờ)
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // Hiện tại + 1 tiếng

        // Lưu token vào Database
        await prisma.user.update({
            where: { email },
            data: { resetToken, resetTokenExpiry }
        });

        // TẠO LINK ĐẶT LẠI MẬT KHẨU (Sửa localhost:5173 thành link Frontend của bạn sau này)
        const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;

        // Gửi email bằng SendGrid
        await sgMail.send({
            to: email,
            from: process.env.EMAIL_FROM!,
            subject: "Yêu cầu đặt lại mật khẩu",
            html: `
                <h3>Xin chào ${user.name},</h3>
                <p>Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng click vào link bên dưới để tạo mật khẩu mới:</p>
                <a href="${resetLink}" target="_blank"><strong>ĐẶT LẠI MẬT KHẨU</strong></a>
                <p>Link này sẽ hết hạn sau 1 giờ.</p>
                <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
            `
        });

        res.json({ success: true, message: "Link đặt lại mật khẩu đã được gửi vào email của bạn" });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
});

// 4. Đặt lại mật khẩu (Reset Password)
app.post("/api/auth/reset-password", async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        // Tìm user có token này và token chưa hết hạn
        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: { gt: new Date() } // expiry phải lớn hơn thời gian hiện tại
            }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: "Token không hợp lệ hoặc đã hết hạn" });
        }

        // Mã hóa mật khẩu mới
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Cập nhật pass mới và xóa bỏ token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedNewPassword,
                resetToken: null,
                resetTokenExpiry: null
            }
        });

        res.json({ success: true, message: "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập." });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
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

        if (type === 'SMS') {
            const speedSmsToken = process.env.SPEEDSMS_TOKEN || '';
            // SpeedSMS yêu cầu mã hóa Base64 cho Token
            const auth = Buffer.from(speedSmsToken + ':x').toString('base64');

            const smsResponse = await fetch('https://api.speedsms.vn/index.php/sms/send', {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    to: [to], // Truyền số điện thoại khách hàng vào đây
                    content: message,
                    sms_type: 2,
                    sender: "" // Để trống để SpeedSMS tự dùng Sender mặc định
                })
            });

            result = await smsResponse.json();

            // Nếu SpeedSMS báo lỗi (ví dụ: hết tiền, sai số...)
            if (result.status !== 'success') {
                throw new Error(`SpeedSMS Error: ${JSON.stringify(result)}`);
            }
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