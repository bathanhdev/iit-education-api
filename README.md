# IIT Education API

Backend API cho he thong IIT Education, xay dung bang NestJS, Prisma va MongoDB. Du an quan ly bai hoc, goi du lieu, khoa kich hoat, thiet bi, danh muc hoc tap va luong xac thuc cho client.

## Cong nghe chinh

- NestJS 10 + TypeScript
- Prisma ORM voi MongoDB
- JWT authentication cho API quan tri
- Swagger/OpenAPI tai `/doc`
- Upload file bang Multer, ho tro upload file lon theo chunk
- Postman collection: `iit-education-api.postman_collection.json`

## Yeu cau moi truong

- Node.js phu hop voi NestJS 10
- npm
- MongoDB connection string
- Prisma Client duoc generate sau khi cai dependency

## Cai dat

```bash
npm install
npx prisma generate
```

Tao file `.env` tu `.env.example`:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

## Bien moi truong

```env
DATABASE_URL="mongodb+srv://user:password@host/database"
SECRET_KEY="replace-with-a-strong-jwt-secret"
ID="admin-id"
PASSWORD="admin-password"
CDN="https://your-cdn.example/"
PORT=3456
```

| Bien | Y nghia |
| --- | --- |
| `DATABASE_URL` | Chuoi ket noi MongoDB cho Prisma |
| `SECRET_KEY` | Secret ky JWT |
| `ID` | Tai khoan admin dung cho `/auth/signin` |
| `PASSWORD` | Mat khau admin dung cho `/auth/signin` |
| `CDN` | Base URL dung khi stream file tu CDN |
| `PORT` | Port chay server, mac dinh `22899` neu khong khai bao |

Khong commit file `.env` len Git. Chi commit `.env.example`.

## Chay du an

```bash
npm run start
npm run start:dev
npm run build
npm run start:prod
```

Khi khoi dong, server tu tao cac thu muc can thiet neu chua co:

- `uploads/`
- `uploads/chunks/`
- `thumbnails/`

## Tai lieu API

Swagger:

```text
http://localhost:<PORT>/doc
```

Postman collection:

```text
iit-education-api.postman_collection.json
```

## Xac thuc

Cac API quan tri duoc bao ve bang JWT Bearer Token, tru cac route public.

Dang nhap admin:

```http
POST /auth/signin
Content-Type: application/json

{
  "id": "admin-id",
  "password": "admin-password"
}
```

Dung token:

```http
Authorization: Bearer <access_token>
```

Route public hien co:

- `GET /`
- `GET /uploads/:file`
- `POST /auth/signin`
- `POST /auth/validate-key`
- `GET /auth/get-data/:key`
- `GET /sub-data/stream/:file`

## Phan trang va loc

Neu truyen `page` hoac `limit`, response co dang:

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

Neu khong truyen `page` va `limit`, API tra array day du de giu tuong thich client cu.

### API danh muc nho khong phan trang

- `GET /subject`
- `GET /topic`
- `GET /grade`
- `GET /data-type`
- `GET /data-pack`

### API nghiep vu lon co phan trang/loc

| API | Query ho tro |
| --- | --- |
| `GET /data` | `page`, `limit`, `search`, `subjectId`, `topicId`, `gradeId`, `dataTypeId`, `dataPackId` |
| `GET /client-key` | `page`, `limit`, `search`, `dataPackId`, `deviceId` |
| `GET /device` | `page`, `limit`, `search`, `clientKeyId`, `keyCount`, `keysCount`, `minKeyCount`, `maxKeyCount` |
| `GET /data-pack/:id/keys` | `page`, `limit`, `search` |
| `GET /sub-data` | `page`, `limit` |

## Quan he du lieu chinh

Du an co nhieu quan he N-N:

- `Data` <-> `Grade`
- `Data` <-> `DataPack`
- `ClientKey` <-> `DataPack`
- `ClientKey` <-> `Device`

Cac API update quan he dung co che `set`, tuc la danh sach id gui len se thay the danh sach hien tai. Khi xoa entity, service se disconnect cac quan he lien quan truoc khi xoa.

Ghi chu:

- Xoa `Device` khong xoa `ClientKey`, chi ngat lien ket.
- Xoa nhieu `Device` cung khong xoa `ClientKey`.
- Update `ClientKey.dataPackIds` se thay the danh sach data pack hien tai bang danh sach moi.

## Quy uoc ten file upload cho SubData

Ca hai huong upload lien quan SubData deu luu file theo ten `subDataId.ext`:

- `POST /sub-data/upload/:id`: luu file dang `uploads/:id.ext`.
- `POST /file-upload/chunk`: file sau khi ghep chunk duoc luu dang `uploads/:id.ext`.
- `ext` lay tu ten file goc. Vi du subData id `65abc` va file `video.mp4` se luu thanh `uploads/65abc.mp4`.

Neu upload lai file cung extension cho cung SubData, file moi se ghi de len file cu. Neu doi extension, file cu khac duong dan se duoc xoa sau khi file moi ghi thanh cong.

## Nhom API

### App

| Method | Endpoint | Mo ta |
| --- | --- | --- |
| `GET` | `/` | Health check: status, timestamp, uptime, Node version, platform and memory usage |
| `GET` | `/uploads/:file` | Stream file upload public |

### Auth

| Method | Endpoint | Mo ta |
| --- | --- | --- |
| `POST` | `/auth/signin` | Dang nhap admin va nhan JWT |
| `POST` | `/auth/validate-key` | Client validate key va gan thiet bi |
| `GET` | `/auth/get-data/:key` | Client lay du lieu theo key |

### Subject

| Method | Endpoint | Mo ta |
| --- | --- | --- |
| `POST` | `/subject` | Tao mon hoc |
| `POST` | `/subject/upload/:id` | Upload anh mon hoc vao `thumbnails/` |
| `GET` | `/subject` | Lay toan bo mon hoc |
| `GET` | `/subject/:id` | Lay chi tiet mon hoc |
| `PATCH` | `/subject/:id` | Cap nhat mon hoc |
| `DELETE` | `/subject/:id` | Xoa mon hoc |

### Topic

| Method | Endpoint | Mo ta |
| --- | --- | --- |
| `POST` | `/topic` | Tao chu de |
| `GET` | `/topic` | Lay toan bo chu de |
| `GET` | `/topic/:id` | Lay chi tiet chu de |
| `PATCH` | `/topic/:id` | Cap nhat chu de |
| `DELETE` | `/topic/:id` | Xoa chu de |

### Grade

| Method | Endpoint | Mo ta |
| --- | --- | --- |
| `POST` | `/grade` | Tao khoi lop |
| `GET` | `/grade` | Lay toan bo khoi lop |
| `GET` | `/grade/:id` | Lay chi tiet khoi lop |
| `PATCH` | `/grade/:id` | Cap nhat khoi lop |
| `DELETE` | `/grade/:id` | Xoa khoi lop |

### Data Type

| Method | Endpoint | Mo ta |
| --- | --- | --- |
| `POST` | `/data-type` | Tao loai du lieu |
| `GET` | `/data-type` | Lay toan bo loai du lieu |
| `GET` | `/data-type/:id` | Lay chi tiet loai du lieu |
| `PATCH` | `/data-type/:id` | Cap nhat loai du lieu |
| `DELETE` | `/data-type/:id` | Xoa loai du lieu |

### Data Pack

| Method | Endpoint | Mo ta |
| --- | --- | --- |
| `POST` | `/data-pack` | Tao goi du lieu |
| `GET` | `/data-pack` | Lay toan bo goi du lieu |
| `GET` | `/data-pack/:id` | Lay chi tiet goi du lieu |
| `GET` | `/data-pack/:id/keys` | Lay keys thuoc goi du lieu, co phan trang/loc |
| `PATCH` | `/data-pack/:id` | Cap nhat goi du lieu |
| `PATCH` | `/data-pack/copy/:id` | Copy data tu goi khac |
| `DELETE` | `/data-pack/:id` | Xoa goi du lieu |

### Data

| Method | Endpoint | Mo ta |
| --- | --- | --- |
| `POST` | `/data` | Tao bai hoc/du lieu |
| `POST` | `/data/create-many` | Tao nhieu bai hoc kem sub-data |
| `GET` | `/data` | Lay danh sach bai hoc, co phan trang/loc |
| `GET` | `/data/:id` | Lay chi tiet bai hoc kem quan he |
| `PATCH` | `/data/:id` | Cap nhat bai hoc |
| `DELETE` | `/data` | Xoa nhieu bai hoc |

### Sub Data

| Method | Endpoint | Mo ta |
| --- | --- | --- |
| `POST` | `/sub-data` | Tao sub-data |
| `POST` | `/sub-data/create-many` | Tao nhieu sub-data |
| `POST` | `/sub-data/upload/:id` | Upload file cho sub-data, luu ten `id.ext` |
| `GET` | `/sub-data` | Lay danh sach sub-data, ho tro phan trang |
| `GET` | `/sub-data/:id` | Lay chi tiet sub-data |
| `GET` | `/sub-data/stream/:file` | Stream file sub-data tu CDN |
| `PATCH` | `/sub-data/:id` | Cap nhat sub-data |
| `DELETE` | `/sub-data/:id` | Xoa sub-data |

### Client Key

| Method | Endpoint | Mo ta |
| --- | --- | --- |
| `POST` | `/client-key` | Tao key |
| `POST` | `/client-key/random` | Tao nhieu key random |
| `GET` | `/client-key` | Lay danh sach key, co phan trang/loc |
| `GET` | `/client-key/:id` | Lay chi tiet key kem data packs va devices |
| `PATCH` | `/client-key/:id` | Cap nhat key |
| `PATCH` | `/client-key/many` | Cap nhat data packs cho nhieu key |
| `DELETE` | `/client-key/:id` | Xoa mot key |
| `POST` | `/client-key/delete_many` | Xoa nhieu key |

Ghi chu cap nhat key:

- Gui `expirationDate` dang `YYYY-MM-DD` de dat han dung.
- Khong gui `expirationDate` hoac gui rong se xoa han dung, dua ve `null`.

### Device

| Method | Endpoint | Mo ta |
| --- | --- | --- |
| `POST` | `/device` | Tao thiet bi |
| `GET` | `/device` | Lay danh sach thiet bi, co phan trang/loc |
| `GET` | `/device/:id` | Lay chi tiet thiet bi kem keys |
| `PATCH` | `/device/:id` | Cap nhat thiet bi va danh sach keys |
| `DELETE` | `/device/:id` | Xoa mot thiet bi |
| `POST` | `/device/delete_many` | Xoa nhieu thiet bi |

Body mau xoa nhieu thiet bi:

```json
{
  "deviceIds": ["device_id_1", "device_id_2"],
  "duids": []
}
```

Co the dung `deviceIds`, `devices`, hoac `duids`. Xoa thiet bi khong xoa `ClientKey`, chi ngat lien ket giua thiet bi va key.

### File Upload

| Method | Endpoint | Mo ta |
| --- | --- | --- |
| `POST` | `/file-upload` | Upload file thuong |
| `POST` | `/file-upload/chunk` | Upload file theo chunk cho sub-data, luu ten `id.ext` |

## Lenh kiem tra

```bash
npm run build
npm run format
npm run lint
npm run test
npm run test:e2e
```

## Luu y van hanh

- Du an dang dung Prisma 5.x. Neu IDE canh bao Prisma 7, can dong bo theo version thuc te truoc khi migrate cau hinh.
- `tsconfig.build.json` tat incremental build de tranh cache cu lam thieu `dist/main.js`.
- Neu doi `PORT`, cap nhat ca `.env` va bien `port` trong Postman collection neu can.
- Cac route quan tri can JWT, tru cac route public da liet ke.
