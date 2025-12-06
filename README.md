# BTL-CNPM – Ứng dụng đặt lịch tư vấn học tập

Nền tảng web hỗ trợ sinh viên đăng ký lịch hẹn/khóa học với giảng viên và giảng viên quản lý các buổi tư vấn. Backend dùng Node.js/Express + MongoDB, frontend dùng React + Vite + SCSS.

## Cấu trúc thư mục
- `BE/`: Backend Express, JWT auth, MongoDB (Mongoose), upload tài liệu (multer).
- `frontend/`: Frontend React 19 + Vite, định tuyến `react-router-dom`, SCSS, axios interceptor.
- `package.json` gốc: phụ thuộc chung (vd. antd) cho toàn repo.

## Yêu cầu
- Node.js >= 18
- MongoDB đang chạy cục bộ hoặc cloud.

## Backend
1) `cd BE`
2) Cài đặt: `npm install`
3) Tạo file `.env` với giá trị phù hợp môi trường của bạn:
```
PORT=8000
DB=mongodb://localhost:27017/btl-cnpm     # connection string MongoDB
JWT_SECRET=changeme                      # khóa ký JWT
FE_URL=http://localhost:5173             # cho CORS
```
4) Chạy server: `npm run dev` (nodemon) hoặc `npm start` (node).

API chính: auth (login sinh viên/giảng viên, JWT), quản lý khoa/ngành, giảng viên, sinh viên, meeting -> session -> session slot, đăng ký meeting/slot, tài liệu học tập (lưu tại `BE/uploads`). Các route được mount dưới `/student`, `/tutor`, `/meeting`, `/session`, `/session-slot`, `/student-with-meeting`, `/student-with-session-slot`, `/material`, `/auth` (xem `BE/routes/index.js`). Các route trừ `/auth` yêu cầu header `Authorization: Bearer <token>`.

## Frontend
1) `cd frontend`
2) Cài đặt: `npm install`
3) Tạo file `.env` hoặc `.env.local`:
```
VITE_BACKEND_URL=http://localhost:8000
```
   (giá trị này cần trùng với `PORT` backend; hằng `BASE_API` mặc định cũng trỏ 127.0.0.1:8000 trong `src/constants/index.jsx`.)
4) Chạy dev server: `npm run dev` rồi mở địa chỉ Vite in ra (mặc định http://localhost:5173).
5) Format trước khi commit: `npm run format` (Prettier). Lint: `npm run lint`. Build: `npm run build`.

Luồng giao diện chính:
- Trang tiền đăng nhập và đăng nhập riêng cho sinh viên/giảng viên.
- Sinh viên: tìm kiếm khóa học/meeting theo giảng viên hoặc ngành, đăng ký tham gia, xem chi tiết buổi, lịch sử hẹn.
- Giảng viên: xem danh sách môn/phần tư vấn, xem chi tiết, mở lớp/đặt slot.
- Bảo vệ route bằng JWT (component `ProtectedRoute`), lưu token trong localStorage.

## Ghi chú thêm
- Đảm bảo `FE_URL` trong `.env` backend trùng origin của frontend để CORS cho phép.
- MongoDB cần dữ liệu mẫu (khoa/ngành/giảng viên/meeting) trước khi kiểm thử luồng; có thể thêm qua các API CRUD tương ứng.
