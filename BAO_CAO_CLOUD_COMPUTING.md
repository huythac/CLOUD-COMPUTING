# BÁO CÁO MÔN HỌC: CLOUD COMPUTING
## Ứng dụng SaaS Quản lý Giao tiếp Khách hàng trên AWS

---

**Môn học:** Cloud Computing  
**Nền tảng:** Amazon Web Services (AWS) — Region ap-southeast-2 (Sydney, Úc)  
**Dịch vụ bên ngoài:** Twilio (SMS) · SendGrid (Email)  
**Ngày:** Tháng 3, 2026  

---

## MỤC LỤC

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Thiết kế và giải thích kiến trúc AWS](#2-thiết-kế-và-giải-thích-kiến-trúc-aws)
3. [Cấu hình dịch vụ đám mây bên ngoài](#3-cấu-hình-dịch-vụ-đám-mây-bên-ngoài)
4. [Quy trình triển khai SaaS](#4-quy-trình-triển-khai-saas)
5. [Các cân nhắc về bảo mật](#5-các-cân-nhắc-về-bảo-mật)
6. [Ảnh chụp màn hình và minh hoạ](#6-ảnh-chụp-màn-hình-và-minh-hoạ)

---

## 1. Tổng quan hệ thống

### 1.1 Giới thiệu

Dự án xây dựng một ứng dụng **SaaS (Software as a Service)** cho phép doanh nghiệp quản lý danh sách khách hàng và gửi thông báo hàng loạt qua hai kênh:

- **Email** — thông qua dịch vụ đám mây SendGrid
- **SMS** — thông qua dịch vụ đám mây Twilio

Toàn bộ hệ thống được thiết kế, cấu hình và triển khai hoàn toàn trên **Amazon Web Services (AWS)** — không có máy chủ vật lý, không có hạ tầng cục bộ.

### 1.2 Chức năng cốt lõi

| Tính năng | Mô tả |
|-----------|-------|
| **Quản lý Contacts** | Thêm, sửa, xóa, tìm kiếm khách hàng; dữ liệu lưu trên cloud (AWS RDS) |
| **Gửi thông điệp** | Chọn nhiều khách hàng, chọn kênh Email hoặc SMS, gửi thực tế qua API đám mây |
| **Communication Logs** | Toàn bộ lịch sử gửi được lưu trên cloud với trạng thái SENT/FAILED |
| **Multi-tenant** | Mỗi người dùng có dữ liệu khách hàng hoàn toàn riêng biệt — đặc trưng cốt lõi của SaaS |

### 1.3 Mô hình dịch vụ Cloud được áp dụng

Dự án thể hiện sự hiểu biết về đủ **3 mô hình dịch vụ Cloud** trong một hệ thống duy nhất:

| Mô hình | Dịch vụ cụ thể | Vai trò trong hệ thống |
|---------|---------------|----------------------|
| **IaaS** — Infrastructure as a Service | AWS EC2, AWS VPC, AWS ALB | Máy chủ ảo chạy backend, mạng nội bộ, cân bằng tải — ta kiểm soát hoàn toàn hệ điều hành và runtime |
| **PaaS** — Platform as a Service | AWS RDS (MySQL) | Cơ sở dữ liệu được AWS quản lý hoàn toàn — tự động backup, patch, failover, không cần cài MySQL thủ công |
| **SaaS** — Software as a Service | Twilio, SendGrid | Dịch vụ gửi SMS/Email hoàn chỉnh — chỉ gọi API, không cần quản lý bất kỳ hạ tầng nào |

> Bản thân **toàn bộ ứng dụng này** cũng là một sản phẩm SaaS: người dùng truy cập qua trình duyệt, dữ liệu trên cloud, không cần cài đặt.

### 1.4 Mô hình triển khai Cloud

Hệ thống sử dụng mô hình **Public Cloud** — toàn bộ hạ tầng thuê từ AWS, chia sẻ hạ tầng vật lý nhưng cô lập hoàn toàn về logic (VPC, Security Groups, IAM).

---

## 2. Thiết kế và giải thích kiến trúc AWS

### 2.1 Sơ đồ kiến trúc tổng thể

```
                          INTERNET
                              │
                      ┌───────▼────────┐
                      │   End Users    │
                      │  (Web Browser) │
                      └───────┬────────┘
                              │ HTTPS
                ┌─────────────▼─────────────┐
                │      AWS CloudFront        │
                │  (CDN · Global Edge Cache) │
                └─────────────┬─────────────┘
                              │
                ┌─────────────▼─────────────┐
                │         AWS S3             │
                │   (Static Website Host)    │
                │   React App Bundle         │
                └───────────────────────────┘

                              │ API Calls (HTTP)
                ┌─────────────▼──────────────────────────┐
                │   AWS Application Load Balancer (ALB)   │
                │   CC-Final-Public-ALB-1857801423        │
                │   Region: ap-southeast-2 (Sydney)       │
                └─────────────┬──────────────────────────┘
                              │ (internal only)
                ┌─────────────▼─────────────┐
                │     AWS EC2 Instance       │
                │   (Node.js REST API)       │
                │   PORT 3000 — not public   │
                └──────┬──────────┬─────────┘
                       │          │
           ┌───────────▼──┐  ┌───▼──────────────────┐
           │   AWS RDS     │  │  External Cloud SaaS  │
           │  (MySQL)      │  │                       │
           │  PaaS — AWS   │  │  ┌──────────────────┐ │
           │  managed      │  │  │  Twilio (SMS)    │ │
           │               │  │  └──────────────────┘ │
           │  3 Tables:    │  │  ┌──────────────────┐ │
           │  User         │  │  │ SendGrid (Email) │ │
           │  Customer     │  │  └──────────────────┘ │
           │  CommLog      │  └──────────────────────┘
           └───────────────┘
```

> 📸 **[CHÈN ẢNH]** Ảnh chụp màn hình AWS Console → EC2 Dashboard hiển thị instance đang chạy (Running state).

> 📸 **[CHÈN ẢNH]** Ảnh chụp màn hình AWS Console → Load Balancers hiển thị ALB `CC-Final-Public-ALB` với trạng thái Active.

### 2.2 Các dịch vụ AWS được sử dụng

#### AWS EC2 (Elastic Compute Cloud) — IaaS
EC2 là lựa chọn IaaS để chạy backend REST API. Instance được đặt trong **private subnet** — không có địa chỉ IP public trực tiếp, chỉ nhận traffic từ ALB. Điều này tạo ra lớp bảo vệ bổ sung: không ai có thể tấn công trực tiếp vào server backend.

- **Loại instance:** Phù hợp cho workload Node.js vừa phải
- **Subnet:** Private (không expose ra internet)
- **Security Group:** Chỉ chấp nhận kết nối từ ALB Security Group

#### AWS Application Load Balancer (ALB) — IaaS
ALB là điểm vào duy nhất (`CC-Final-Public-ALB-1857801423.ap-southeast-2.elb.amazonaws.com`) tiếp nhận toàn bộ request từ internet. ALB được chọn thay vì Classic Load Balancer vì:

- Hỗ trợ **path-based routing** (phân biệt `/customers`, `/send`, `/logs`)
- Tích hợp với **Target Groups** — dễ thêm EC2 instance khi scale
- Hỗ trợ gắn **SSL Certificate** (AWS ACM) để bật HTTPS
- Tích hợp với **AWS WAF** để chặn request độc hại

**Cấu hình Target Group:**

| Thuộc tính | Giá trị |
|-----------|--------|
| Protocol | HTTP |
| Port | 3000 |
| Health Check Path | `GET /` |
| Health Check Response | `"API is running"` |
| Healthy threshold | 2 lần liên tiếp |
| Unhealthy threshold | 3 lần liên tiếp |

> 📸 **[CHÈN ẢNH]** Ảnh chụp màn hình AWS Console → Target Groups → tab "Targets" hiển thị EC2 instance với trạng thái "healthy".

#### AWS RDS (Relational Database Service) — PaaS
RDS cung cấp MySQL được quản lý hoàn toàn. So sánh với việc tự cài MySQL trên EC2:

| Tiêu chí | Tự cài MySQL trên EC2 | AWS RDS (PaaS) |
|---------|----------------------|----------------|
| Backup | Tự làm thủ công | Tự động hàng ngày |
| Patch bảo mật | Tự cập nhật | AWS tự động |
| Failover | Tự cấu hình Replica | Multi-AZ option sẵn có |
| Monitoring | Tự cài CloudWatch agent | Tích hợp sẵn |
| **Chi phí quản lý** | **Cao** | **Thấp** |

RDS được đặt trong **private subnet**, chỉ EC2 mới kết nối được — không expose cổng 3306 ra internet.

**Schema cơ sở dữ liệu:**

| Bảng | Vai trò | Quan hệ |
|------|---------|---------|
| `User` | Người dùng SaaS (multi-tenant root) | 1 User → N Customers |
| `Customer` | Khách hàng của từng User | N Customers → N Logs |
| `CommunicationLog` | Lịch sử gửi SMS/Email | Gắn với cả User và Customer |

**Thiết kế hỗ trợ Multi-tenant:** Mỗi bảng `Customer` và `CommunicationLog` đều có `userId` — mọi query đều được filter theo user hiện tại, đảm bảo người dùng A không thể truy cập dữ liệu của người dùng B.

> 📸 **[CHÈN ẢNH]** Ảnh chụp màn hình AWS Console → RDS → Database instance hiển thị trạng thái "Available".

#### AWS VPC (Virtual Private Cloud) — IaaS
Toàn bộ tài nguyên (EC2, RDS, ALB) được đặt trong một VPC riêng. Cấu trúc mạng:

```
VPC (10.0.0.0/16)
├── Public Subnet  → ALB (internet-facing)
└── Private Subnet → EC2 + RDS (không public)
```

Thiết kế này tuân thủ nguyên tắc **Defense in Depth** — nhiều lớp bảo vệ thay vì một tường lửa duy nhất.

### 2.3 Luồng dữ liệu

**Luồng gửi tin nhắn (Send Message):**

```
[User nhập tin nhắn trên web]
        ↓
[React App gọi POST /send → qua ALB]
        ↓
[EC2: Nhận request, xác định kênh gửi]
        ↓                    ↓
[Twilio API: Gửi SMS]   [SendGrid API: Gửi Email]
        ↓                    ↓
[Dù thành công hay thất bại → ghi CommunicationLog vào RDS]
        ↓
[Response trả về trạng thái từng recipient]
```

**Tại sao luôn ghi log kể cả khi thất bại?** Đây là yêu cầu thiết yếu của hệ thống SaaS — **audit trail** đầy đủ giúp theo dõi, debug và chứng minh việc gửi thông điệp với khách hàng.

---

## 3. Cấu hình dịch vụ đám mây bên ngoài

### 3.1 Twilio — Dịch vụ SaaS gửi SMS

Twilio là một SaaS cung cấp API gửi SMS đến mọi số điện thoại trên thế giới. Thay vì xây dựng hạ tầng viễn thông riêng (cực kỳ tốn kém), ứng dụng tích hợp Twilio qua HTTP API.

**Cơ chế hoạt động:**

```
Ứng dụng  →  POST https://api.twilio.com/Messages
             (kèm SID + Token xác thực)
                    ↓
             Twilio xử lý, kết nối mạng viễn thông
                    ↓
             SMS được gửi đến số điện thoại thực
                    ↓
             Twilio trả về message.sid (mã theo dõi)
```

**Thông tin cấu hình cần thiết:**

| Biến môi trường | Lấy từ đâu | Mục đích |
|----------------|-----------|---------|
| `TWILIO_SID` | Twilio Console → Account Info | Định danh tài khoản |
| `TWILIO_TOKEN` | Twilio Console → Account Info | Xác thực request |
| `TWILIO_PHONE` | Twilio Console → Phone Numbers | Số gửi đi |

**Các bước cấu hình:**
1. Đăng ký tài khoản Twilio → Xác minh số điện thoại nhận (bắt buộc với Trial)
2. Mua một Twilio Phone Number (số gửi đi)
3. Lấy Account SID và Auth Token từ Console Dashboard
4. Lưu vào biến môi trường trên EC2 (không hardcode)
5. SDK `twilio` cho Node.js xử lý việc gọi API và trả về kết quả

> 📸 **[CHÈN ẢNH]** Ảnh chụp màn hình Twilio Console → Monitor → Logs → Messages hiển thị danh sách SMS đã gửi với trạng thái "delivered".

### 3.2 SendGrid — Dịch vụ SaaS gửi Email

SendGrid là SaaS chuyên gửi email giao dịch (transactional email) với tỷ lệ deliverability cao. Tương tự Twilio, đây là bài toán thuê dịch vụ thay vì tự xây dựng mail server.

**Cơ chế hoạt động:**

```
Ứng dụng  →  POST https://api.sendgrid.com/v3/mail/send
             (kèm API Key xác thực)
                    ↓
             SendGrid xử lý, tối ưu deliverability
                    ↓
             Email được gửi đến hộp thư người nhận
                    ↓
             HTTP 202 Accepted (gửi thành công)
```

**Thông tin cấu hình cần thiết:**

| Biến môi trường | Lấy từ đâu | Mục đích |
|----------------|-----------|---------|
| `SENDGRID_KEY` | SendGrid → Settings → API Keys | Xác thực request |
| `EMAIL_FROM` | SendGrid → Sender Authentication | Địa chỉ gửi đã xác minh |

**Các bước cấu hình:**
1. Đăng ký tài khoản SendGrid
2. Vào **Settings → Sender Authentication** → xác minh domain hoặc email gửi
3. Vào **Settings → API Keys** → tạo API Key với quyền "Mail Send"
4. Lưu API Key vào biến môi trường (chỉ hiển thị một lần, phải lưu ngay)
5. SDK `@sendgrid/mail` cho Node.js xử lý phần còn lại

> 📸 **[CHÈN ẢNH]** Ảnh chụp màn hình SendGrid → Activity Feed hiển thị danh sách email đã gửi với trạng thái "Delivered".

### 3.3 So sánh và lý do chọn Twilio + SendGrid

| Tiêu chí | Twilio | SendGrid |
|---------|--------|---------|
| Loại dịch vụ | SaaS API | SaaS API |
| Hạ tầng cần quản lý | Không có | Không có |
| SDK Node.js chính thức | ✅ | ✅ |
| Free tier | ✅ (trial $15) | ✅ (100 email/ngày) |
| Deliverability | Hạ tầng viễn thông global | Tối ưu cho email |
| Phù hợp Cloud Computing | ✅ Minh họa SaaS integration | ✅ Minh họa SaaS integration |

### 3.4 Tích hợp vào kiến trúc AWS

Luồng kết nối từ EC2 ra các dịch vụ SaaS bên ngoài:

```
EC2 (trong Private Subnet)
    → NAT Gateway (ra internet)
        → api.twilio.com (HTTPS)
        → api.sendgrid.com (HTTPS)
```

EC2 không có IP public, nhưng vẫn kết nối được ra internet qua **NAT Gateway** — đây là cấu hình chuẩn để instance trong private subnet gọi external APIs mà không bị expose.

---

## 4. Quy trình triển khai SaaS

### 4.1 Định nghĩa SaaS trong dự án

Ứng dụng được thiết kế đáp ứng đầy đủ các đặc trưng của SaaS:

| Đặc trưng SaaS | Cách thực hiện trong dự án |
|---------------|--------------------------|
| **Truy cập qua web** | Người dùng chỉ cần trình duyệt, không cài đặt gì |
| **Dữ liệu trên cloud** | 100% dữ liệu lưu trên AWS RDS — không có gì trên máy người dùng |
| **Multi-tenancy** | Mỗi User có dataset riêng biệt, cô lập hoàn toàn |
| **Tích hợp dịch vụ** | Twilio và SendGrid được tích hợp như building blocks |
| **Subscription model** | Kiến trúc sẵn sàng để thêm billing theo User |

### 4.2 Các bước triển khai Backend lên AWS EC2

**Bước 1 — Chuẩn bị EC2 Instance**
- Tạo EC2 instance trong AWS Console, chọn AMI (Amazon Linux 2 hoặc Ubuntu)
- Đặt instance trong **private subnet** của VPC
- Gắn Security Group chỉ cho phép ALB kết nối vào

**Bước 2 — Cài đặt môi trường chạy**
- Cài Node.js (runtime cho backend)
- Clone source code từ repository lên EC2

**Bước 3 — Cấu hình biến môi trường**

Tất cả thông tin nhạy cảm (database password, API keys) được lưu dưới dạng biến môi trường trên server — không có trong source code:

```
DATABASE_URL  →  Kết nối đến AWS RDS endpoint
TWILIO_SID    →  Xác thực Twilio API
TWILIO_TOKEN  →  Xác thực Twilio API
TWILIO_PHONE  →  Số điện thoại gửi đi
SENDGRID_KEY  →  Xác thực SendGrid API
EMAIL_FROM    →  Địa chỉ email gửi đi
```

**Bước 4 — Chạy Database Migration**
- Prisma Migration tạo toàn bộ bảng trong RDS từ schema định nghĩa sẵn
- Chỉ cần chạy một lần khi deploy lần đầu

**Bước 5 — Build và chạy server**
- TypeScript được compile thành JavaScript
- Server khởi động, lắng nghe trên PORT 3000

**Bước 6 — Đăng ký EC2 vào ALB Target Group**
- Trong AWS Console: EC2 instance được thêm vào Target Group của ALB
- ALB bắt đầu health check → nếu `GET /` trả về `"API is running"` → target chuyển sang trạng thái **Healthy**
- Từ thời điểm này, mọi request đến ALB endpoint đều được forward vào EC2

> 📸 **[CHÈN ẢNH]** Ảnh chụp màn hình AWS Console → EC2 → Connect, hoặc ảnh terminal SSH đang kết nối vào EC2.

> 📸 **[CHÈN ẢNH]** Ảnh chụp màn hình trình duyệt truy cập `http://CC-Final-Public-ALB-1857801423.ap-southeast-2.elb.amazonaws.com/` trả về `"API is running"`.

### 4.3 Các bước triển khai Frontend

**Bước 1 — Build React App**
- Vite bundle toàn bộ React app thành static files (HTML, CSS, JS)
- File `api.ts` được cấu hình trỏ vào ALB endpoint trước khi build

**Bước 2 — Upload lên AWS S3**
- Tạo S3 Bucket với tính năng Static Website Hosting
- Upload toàn bộ nội dung thư mục `dist/` lên bucket
- Cấu hình Bucket Policy cho phép public read

**Bước 3 — Phân phối qua CloudFront**
- Tạo CloudFront Distribution trỏ vào S3 bucket
- CloudFront cache nội dung tại các Edge Location toàn cầu
- Người dùng tải app từ edge gần nhất → giảm latency

> 📸 **[CHÈN ẢNH]** Ảnh chụp màn hình AWS Console → S3 → Bucket → Objects hiển thị các file frontend đã upload (index.html, assets/).

> 📸 **[CHÈN ẢNH]** Ảnh chụp màn hình AWS Console → CloudFront → Distribution với trạng thái "Enabled".

### 4.4 Khả năng mở rộng (Scalability)

Kiến trúc hiện tại hỗ trợ scale theo chiều ngang mà **không cần thay đổi code**:

```
Hiện tại (1 EC2):           Khi traffic tăng:
                            
ALB → EC2 → RDS             ALB → EC2 #1 ─┐
                                 → EC2 #2 ├─→ RDS
                                 → EC2 #N ─┘
```

Bước tiếp theo để tự động hóa: Thêm **Auto Scaling Group** quản lý đội EC2 — tự động thêm/bớt instance dựa trên CPU hoặc số lượng request, thanh toán theo lượng dùng thực tế (Pay-as-you-go).

---

## 5. Các cân nhắc về bảo mật

### 5.1 Bảo mật ở tầng Hạ tầng AWS

**AWS Security Groups — Tường lửa ảo:**

Mỗi tài nguyên AWS có Security Group riêng, hoạt động như firewall stateful:

| Tài nguyên | Inbound được phép | Inbound bị chặn |
|-----------|-----------------|----------------|
| **ALB** | Port 80/443 từ 0.0.0.0/0 (internet) | Mọi thứ khác |
| **EC2** | Port 3000 từ ALB Security Group | Internet trực tiếp |
| **RDS** | Port 3306 từ EC2 Security Group | Internet, ALB, mọi thứ khác |

Thiết kế này tuân thủ nguyên tắc **Least Privilege** — mỗi thành phần chỉ nhận đúng loại traffic cần thiết.

**AWS VPC Isolation:**
- EC2 và RDS trong **private subnet** — không có route ra internet trực tiếp
- Chỉ ALB (public subnet) mới nhận traffic từ internet
- Đây là mô hình chuẩn **3-tier architecture** trên cloud

### 5.2 Bảo mật Thông tin nhạy cảm

Tất cả credentials (database password, API keys của Twilio và SendGrid) đều được lưu dưới dạng **biến môi trường** trên EC2, không xuất hiện trong source code hay Git repository.

Điều này ngăn chặn tình huống phổ biến: người vô tình commit API keys lên GitHub và bị bot quét tự động đánh cắp trong vài phút.

**Các loại thông tin cần bảo vệ:**

| Thông tin | Hậu quả nếu lộ |
|----------|---------------|
| `DATABASE_URL` (chứa password RDS) | Toàn bộ dữ liệu khách hàng bị lộ hoặc xóa |
| `TWILIO_TOKEN` | Kẻ tấn công gửi SMS vô hạn với chi phí của bạn |
| `SENDGRID_KEY` | Kẻ tấn công gửi email spam/phishing dưới danh nghĩa bạn |

**Bước nâng cao (Production):** Dùng **AWS Secrets Manager** để quản lý secrets tập trung, rotate tự động, audit log mỗi lần access.

### 5.3 Bảo mật Dữ liệu

**Chống SQL Injection:** Toàn bộ query database đều thông qua Prisma ORM với prepared statements — không có raw SQL, không có nguy cơ injection.

**Toàn vẹn dữ liệu:** Database schema có Cascade Delete — khi xóa một User, toàn bộ Customers và CommunicationLogs liên quan tự động được xóa, không có dữ liệu mồ côi.

**Audit Trail:** Mọi hành động gửi SMS/Email đều được ghi vào `CommunicationLog` kèm timestamp, trạng thái và nội dung — kể cả các lần thất bại. Đây là yêu cầu thiết yếu của hệ thống SaaS tuân thủ GDPR hoặc các quy định bảo vệ dữ liệu.

### 5.4 Bảo mật API

**CORS (Cross-Origin Resource Sharing):** Backend cấu hình CORS để chỉ frontend domain được phép gọi API, ngăn các website bên thứ ba giả mạo request.

**HTTPS:** ALB hỗ trợ gắn SSL Certificate từ **AWS Certificate Manager (ACM)** miễn phí — khi bật, toàn bộ traffic giữa người dùng và ALB được mã hóa, ngăn chặn tấn công Man-in-the-Middle.

### 5.5 Những cải tiến tiếp theo cho Production

| Hạng mục | Giải pháp AWS | Lợi ích |
|---------|-------------|--------|
| Xác thực người dùng | **AWS Cognito** | User Pool, JWT tokens, MFA sẵn có |
| Bảo vệ API khỏi tấn công | **AWS WAF** | Chặn SQL injection, XSS, rate limit |
| HTTPS | **AWS ACM** + ALB | Chứng chỉ SSL miễn phí, tự động renew |
| Quản lý secrets | **AWS Secrets Manager** | Rotation tự động, audit log |
| Giám sát bất thường | **AWS CloudWatch** | Alert khi có spike bất thường |

---

## 6. Ảnh chụp màn hình và minh hoạ

### 6.1 Giao diện ứng dụng – Trang Contacts

Trang Contacts cho phép quản lý toàn bộ danh sách khách hàng: thêm mới, chỉnh sửa, xóa, tìm kiếm, và chọn nhiều khách hàng để gửi tin nhắn hàng loạt. Dữ liệu được lấy trực tiếp từ AWS RDS thông qua API backend trên EC2.

> 📸 **[CHÈN ẢNH]** Ảnh chụp màn hình trang Contacts đang hiển thị danh sách khách hàng từ database.

> 📸 **[CHÈN ẢNH]** Ảnh chụp màn hình modal "Add Contact" hoặc "Edit Contact" đang mở.

### 6.2 Giao diện ứng dụng – Trang Send Message

Trang Send Message là nơi thể hiện rõ nhất tích hợp dịch vụ đám mây: người dùng chọn kênh (Email hoặc SMS), nhập nội dung, và ứng dụng gọi thực tế đến Twilio/SendGrid API qua backend trên AWS.

> 📸 **[CHÈN ẢNH]** Ảnh chụp màn hình trang Send Message với danh sách recipients đã chọn và nội dung tin nhắn.

> 📸 **[CHÈN ẢNH]** Ảnh chụp màn hình trang Send Message sau khi gửi — hiển thị kết quả ✅ thành công hoặc ❌ thất bại cho từng người nhận.

### 6.3 Giao diện ứng dụng – Trang Communication Logs

Trang Logs hiển thị toàn bộ lịch sử gửi SMS/Email được lưu trong AWS RDS, bao gồm filter theo kênh và tìm kiếm theo nội dung.

> 📸 **[CHÈN ẢNH]** Ảnh chụp màn hình trang Communication Logs hiển thị lịch sử gửi với các trạng thái SENT và FAILED.

### 6.4 Bằng chứng triển khai AWS

**Health Check ALB hoạt động:**

Backend đang chạy trên EC2 và phản hồi qua ALB endpoint thực tế:

```
Request:  GET http://CC-Final-Public-ALB-1857801423.ap-southeast-2.elb.amazonaws.com/
Response: "API is running"
```

> 📸 **[CHÈN ẢNH]** Ảnh chụp màn hình trình duyệt hoặc Postman/curl truy cập ALB endpoint trả về response.

> 📸 **[CHÈN ẢNH]** Ảnh chụp màn hình AWS Console → EC2 → Instances hiển thị instance "Running" với Instance ID.

> 📸 **[CHÈN ẢNH]** Ảnh chụp màn hình AWS Console → RDS → Databases hiển thị database "Available".

### 6.5 Bằng chứng tích hợp Twilio (SMS)

> 📸 **[CHÈN ẢNH]** Ảnh chụp màn hình Twilio Console → Monitor → Logs → Messages hiển thị tin nhắn đã gửi.

> 📸 **[CHÈN ẢNH]** (Tuỳ chọn) Ảnh chụp SMS thực tế nhận được trên điện thoại.

### 6.6 Bằng chứng tích hợp SendGrid (Email)

> 📸 **[CHÈN ẢNH]** Ảnh chụp màn hình SendGrid → Activity Feed hiển thị email "Delivered".

> 📸 **[CHÈN ẢNH]** (Tuỳ chọn) Ảnh chụp email thực tế nhận được trong hộp thư.

---

## KẾT LUẬN

Dự án đã thiết kế, cấu hình và triển khai thành công một ứng dụng **SaaS Communication Platform** hoàn chỉnh trên AWS, đáp ứng đầy đủ các yêu cầu của môn Cloud Computing:

| Yêu cầu | Kết quả |
|---------|--------|
| **Thiết kế kiến trúc đám mây bằng AWS** | ✅ VPC + EC2 + ALB + RDS trên region ap-southeast-2 với phân lớp public/private subnet |
| **Phát triển và triển khai ứng dụng web** | ✅ React SPA trên S3/CloudFront + Express REST API trên EC2 + MySQL trên RDS |
| **Tích hợp dịch vụ đám mây bên ngoài** | ✅ Twilio (SMS) và SendGrid (Email) tích hợp hoàn chỉnh với audit logging |
| **Triển khai SaaS bảo mật và có khả năng mở rộng** | ✅ Multi-tenant, Security Groups, biến môi trường, kiến trúc sẵn sàng scale ngang |
| **Hiểu biết về mô hình Cloud** | ✅ Ứng dụng đồng thời IaaS (EC2/VPC/ALB) + PaaS (RDS) + SaaS (Twilio/SendGrid) trong một hệ thống |

Hệ thống hiện đang hoạt động trên AWS với endpoint công khai tại:
**`http://CC-Final-Public-ALB-1857801423.ap-southeast-2.elb.amazonaws.com`**

---

*Báo cáo được viết dựa trên source code và kiến trúc triển khai thực tế của dự án CLOUD-COMPUTING.*
