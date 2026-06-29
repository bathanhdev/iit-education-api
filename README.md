# IIT Education API

Backend API cho hệ thống IIT Education, xây dựng bằng NestJS, Prisma và MongoDB. Dự án quản lý bài học, gói dữ liệu, khóa kích hoạt, thiết bị, danh mục học tập và luồng xác thực cho client.

## Công nghệ chính

- NestJS 10 + TypeScript
- Prisma ORM với MongoDB
- JWT authentication cho API quản trị
- Swagger/OpenAPI tại `/doc`
- Upload file bằng Multer, hỗ trợ file lớn/chunk upload
- Postman collection: `iit-education-api.postman_collection.json`

## Yêu cầu môi trường

- Node.js phù hợp với NestJS 10
- npm
- MongoDB connection string
- Prisma Client được generate sau khi cài dependency

## Cài đặt

```bash
npm install
npx prisma generate
```

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Trên Windows PowerShell có thể dùng:

```powershell
Copy-Item .env.example .env
```

## Biến môi trường

```env
DATABASE_URL="mongodb+srv://user:password@host/database"
SECRET_KEY="replace-with-a-strong-jwt-secret"
ID="admin-id"
PASSWORD="admin-password"
CDN="https://your-cdn.example/"
PORT=3456
```

| Biến | Ý nghĩa |
| --- | --- |
| `DATABASE_URL` | Chuỗi kết nối MongoDB cho Prisma |
| `SECRET_KEY` | Secret ký JWT |
| `ID` | Tài khoản admin dùng cho `/auth/signin` |
| `PASSWORD` | Mật khẩu admin dùng cho `/auth/signin` |
| `CDN` | Base URL dùng khi stream file từ CDN |
| `PORT` | Port chạy server, mặc định `22899` nếu không khai báo |

Không commit file `.env` lên Git. Chỉ commit `.env.example`.

## Chạy dự án

```bash
# Chạy development
npm run start

# Watch mode
npm run start:dev

# Build production
npm run build

# Chạy build production
npm run start:prod
```

Khi khởi động, server tự tạo các thư mục cần thiết nếu chưa có:

- `uploads/`
- `uploads/chunks/`
- `thumbnails/`

## Tài liệu API

Sau khi server chạy, mở Swagger tại:

```text
http://localhost:<PORT>/doc
```

Ví dụ nếu `PORT=3456`:

```text
http://localhost:3456/doc
```

Postman collection nằm tại:

```text
iit-education-api.postman_collection.json
```

Collection đã khai báo biến `baseUrl`, `port`, `page`, `limit`, `search` và các id thường dùng.

## Xác thực

Các API quản trị được bảo vệ bằng JWT Bearer Token, trừ các route được đánh dấu public.

Đăng nhập admin:

```http
POST /auth/signin
Content-Type: application/json

{
  "id": "admin-id",
  "password": "admin-password"
}
```

Response trả về:

```json
{
  "access_token": "..."
}
```

Khi gọi API quản trị, gửi header:

```http
Authorization: Bearer <access_token>
```

Route public hiện có:

- `GET /`
- `GET /uploads/:file`
- `POST /auth/signin`
- `POST /auth/validate-key`
- `GET /auth/get-data/:key`
- `GET /sub-data/stream/:file`

## Quy ước response phân trang

Các API danh sách lớn hỗ trợ phân trang bằng query `page` và `limit`.

Ví dụ:

```http
GET /data?page=1&limit=20
```

Khi có `page` hoặc `limit`, response có dạng:

```json
{
  "data": [],
  "meta": {
    "total": 0,
    "page": 1,
    "limit": 20,
    "totalPages": 0
  }
}
```

Nếu không truyền `page` và `limit`, API trả về array đầy đủ để giữ tương thích với client cũ.

## Phân loại API danh sách

### API danh mục nhỏ

Các API này trả toàn bộ danh sách, không phân trang vì số lượng dữ liệu nhỏ và thường dùng để render bộ lọc:

- `GET /subject`
- `GET /topic`
- `GET /grade`
- `GET /data-type`
- `GET /data-pack`

### API nghiệp vụ lớn

Các API này hỗ trợ phân trang và lọc phía server:

| API | Query hỗ trợ |
| --- | --- |
| `GET /data` | `page`, `limit`, `search`, `subjectId`, `topicId`, `gradeId`, `dataTypeId`, `dataPackId` |
| `GET /client-key` | `page`, `limit`, `search`, `dataPackId`, `deviceId` |
| `GET /device` | `page`, `limit`, `search`, `clientKeyId`, `keyCount`, `keysCount`, `minKeyCount`, `maxKeyCount` |
| `GET /data-pack/:id/keys` | `page`, `limit`, `search` |
| `GET /sub-data` | `page`, `limit` |

Ghi chú với `GET /device`:

- `keyCount=2`: chỉ lấy thiết bị có đúng 2 keys.
- `minKeyCount=1`: lấy thiết bị có từ 1 key trở lên.
- `maxKeyCount=3`: lấy thiết bị có tối đa 3 keys.
- Có thể kết hợp `minKeyCount` và `maxKeyCount` để lọc theo khoảng.

## Quan hệ dữ liệu chính

Dự án có nhiều quan hệ nhiều-nhiều:

- `Data` ↔ `Grade`
- `Data` ↔ `DataPack`
- `ClientKey` ↔ `DataPack`
- `ClientKey` ↔ `Device`

Các API update quan hệ đang dùng cơ chế thay thế danh sách bằng `set`, phù hợp khi client gửi danh sách id mới đầy đủ. Khi xóa entity, service sẽ ngắt liên kết liên quan trước khi xóa để tránh dữ liệu quan hệ bị lệch.

Ví dụ:

- Xóa `Device` chỉ xóa thiết bị và ngắt liên kết khỏi `ClientKey`, không xóa key.
- Xóa nhiều `Device` cũng chỉ xóa thiết bị và disconnect khỏi keys.
- Update `ClientKey.dataPackIds` sẽ thay thế danh sách gói dữ liệu hiện tại bằng danh sách mới gửi lên.

## Nhóm API

### App

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `GET` | `/` | Health check: status, timestamp, uptime, Node version, platform and memory usage |
| `GET` | `/uploads/:file` | Truy cập file upload public |

### Auth

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `POST` | `/auth/signin` | Đăng nhập admin và nhận JWT |
| `POST` | `/auth/validate-key` | Client validate key và gắn thiết bị |
| `GET` | `/auth/get-data/:key` | Client lấy dữ liệu theo key |

### Subject

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `POST` | `/subject` | Tạo môn học |
| `POST` | `/subject/upload/:id` | Upload ảnh môn học |
| `GET` | `/subject` | Lấy toàn bộ môn học |
| `GET` | `/subject/:id` | Lấy chi tiết môn học |
| `PATCH` | `/subject/:id` | Cập nhật môn học |
| `DELETE` | `/subject/:id` | Xóa môn học |

### Topic

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `POST` | `/topic` | Tạo chủ đề |
| `GET` | `/topic` | Lấy toàn bộ chủ đề |
| `GET` | `/topic/:id` | Lấy chi tiết chủ đề |
| `PATCH` | `/topic/:id` | Cập nhật chủ đề |
| `DELETE` | `/topic/:id` | Xóa chủ đề |

### Grade

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `POST` | `/grade` | Tạo khối lớp |
| `GET` | `/grade` | Lấy toàn bộ khối lớp |
| `GET` | `/grade/:id` | Lấy chi tiết khối lớp |
| `PATCH` | `/grade/:id` | Cập nhật khối lớp |
| `DELETE` | `/grade/:id` | Xóa khối lớp |

### Data Type

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `POST` | `/data-type` | Tạo loại dữ liệu |
| `GET` | `/data-type` | Lấy toàn bộ loại dữ liệu |
| `GET` | `/data-type/:id` | Lấy chi tiết loại dữ liệu |
| `PATCH` | `/data-type/:id` | Cập nhật loại dữ liệu |
| `DELETE` | `/data-type/:id` | Xóa loại dữ liệu |

### Data Pack

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `POST` | `/data-pack` | Tạo gói dữ liệu |
| `GET` | `/data-pack` | Lấy toàn bộ gói dữ liệu |
| `GET` | `/data-pack/:id` | Lấy chi tiết gói dữ liệu, kèm data và keys |
| `GET` | `/data-pack/:id/keys` | Lấy keys thuộc gói dữ liệu, có phân trang/lọc |
| `PATCH` | `/data-pack/:id` | Cập nhật gói dữ liệu |
| `PATCH` | `/data-pack/copy/:id` | Copy data từ gói khác |
| `DELETE` | `/data-pack/:id` | Xóa gói dữ liệu |

### Data

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `POST` | `/data` | Tạo bài học/dữ liệu |
| `POST` | `/data/create-many` | Tạo nhiều bài học kèm sub-data |
| `GET` | `/data` | Lấy danh sách bài học, có phân trang/lọc |
| `GET` | `/data/:id` | Lấy chi tiết bài học, kèm quan hệ |
| `PATCH` | `/data/:id` | Cập nhật bài học |
| `DELETE` | `/data` | Xóa nhiều bài học |

### Sub Data

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `POST` | `/sub-data` | Tạo sub-data |
| `POST` | `/sub-data/create-many` | Tạo nhiều sub-data |
| `POST` | `/sub-data/upload/:id` | Upload file cho sub-data |
| `GET` | `/sub-data` | Lấy danh sách sub-data, hỗ trợ phân trang |
| `GET` | `/sub-data/:id` | Lấy chi tiết sub-data |
| `GET` | `/sub-data/stream/:file` | Stream file sub-data từ CDN |
| `PATCH` | `/sub-data/:id` | Cập nhật sub-data |
| `DELETE` | `/sub-data/:id` | Xóa sub-data |

### Client Key

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `POST` | `/client-key` | Tạo key |
| `POST` | `/client-key/random` | Tạo nhiều key random |
| `GET` | `/client-key` | Lấy danh sách key, có phân trang/lọc |
| `GET` | `/client-key/:id` | Lấy chi tiết key, kèm data packs và devices |
| `PATCH` | `/client-key/:id` | Cập nhật key |
| `PATCH` | `/client-key/many` | Cập nhật data packs cho nhiều key |
| `DELETE` | `/client-key/:id` | Xóa một key |
| `POST` | `/client-key/delete_many` | Xóa nhiều key |

Ghi chú cập nhật key:

- Gửi `expirationDate` dạng `YYYY-MM-DD` để đặt hạn dùng.
- Không gửi `expirationDate` hoặc gửi rỗng sẽ xóa hạn dùng, đưa về `null`.

### Device

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `POST` | `/device` | Tạo thiết bị |
| `GET` | `/device` | Lấy danh sách thiết bị, có phân trang/lọc |
| `GET` | `/device/:id` | Lấy chi tiết thiết bị, kèm keys |
| `PATCH` | `/device/:id` | Cập nhật thiết bị và danh sách keys |
| `DELETE` | `/device/:id` | Xóa một thiết bị |
| `POST` | `/device/delete_many` | Xóa nhiều thiết bị |

Body mẫu xóa nhiều thiết bị:

```json
{
  "deviceIds": ["device_id_1", "device_id_2"],
  "duids": []
}
```

Có thể dùng `deviceIds`, `devices`, hoặc `duids`. Xóa thiết bị không xóa `ClientKey`; chỉ ngắt liên kết giữa thiết bị và key.

### File Upload

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `POST` | `/file-upload` | Upload file thường |
| `POST` | `/file-upload/chunk` | Upload file theo chunk |

## Lệnh kiểm tra

```bash
# Build TypeScript/NestJS
npm run build

# Format code
npm run format

# Lint và auto-fix
npm run lint

# Unit test
npm run test

# E2E test
npm run test:e2e
```

## Lưu ý vận hành

- Dự án đang dùng Prisma 5.x. Nếu IDE cài extension Prisma mới cảnh báo về Prisma 7, cần đồng bộ theo version thực tế của project trước khi migrate cấu hình.
- `tsconfig.build.json` đã tắt incremental build để tránh cache cũ làm thiếu `dist/main.js`.
- Nếu đổi `PORT`, cập nhật cả `.env` và biến `port` trong Postman collection nếu cần.
- Các route quản trị cần JWT, trừ các route public đã liệt kê ở phần xác thực.
