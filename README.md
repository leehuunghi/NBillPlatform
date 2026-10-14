# NBill - chia tiền nhóm bạn

Web app mobile-first cho 1 nhóm bạn (mặc định 10 người). Không có đăng nhập:
mỗi người chọn profile của mình ở lần đầu, máy nhớ bằng `localStorage`.

## Chạy local

```bash
make local        # hoặc: npm install && npm run dev:all
npm test          # test logic server (quyền sửa, số dư)
```

Trang nhóm: `/`. Trang quản trị (admin xem/sửa mọi khoản chi, ghi nhận thanh toán,
cấu hình tài khoản nhận tiền): `/superadmin`.

> Khi chạy local, nếu môi trường có sẵn `GITHUB_TOKEN` thì server sẽ ghi dữ liệu
> lên GitHub thay vì `src/data.json`. Bỏ biến này đi nếu chỉ muốn thử cục bộ.

## Dữ liệu: `src/data.json`

Khai báo 10 thành viên (xem mẫu ở `src/data.sample.json`):

```json
{ "id": 1, "name": "Nghị", "avatar": "/avatars/nghi.jpg", "isTreasurer": true }
```

- `avatar`: ảnh đặt trong `public/avatars/` (hoặc URL). Thiếu ảnh thì hiện chữ cái đầu.
- `isTreasurer: true` cho đúng 1 người: đó là admin, người ứng tiền và nhận QR trả nợ.
- Tài khoản nhận tiền: `treasurerBankBin`, `treasurerAccountNo`, `treasurerAccountName`
  (cũng sửa được ở `/superadmin`). Tạo QR cần `VIETQR_CLIENT_ID` / `VIETQR_API_KEY` trong `.env`.

## Quyền hạn (không phải bảo mật thật)

- Mọi thành viên thêm được khoản chi và chỉ sửa/xóa được khoản do mình tạo (`createdBy`).
- `/superadmin` sửa/xóa mọi khoản chi và ghi nhận thanh toán.
- Server kiểm tra `actorId`/`asAdmin` do client gửi lên, chỉ để chống bấm nhầm trong nhóm tin nhau.

## Text giao diện

Toàn bộ chữ nằm ở `src/locales/vi.json` (dùng `{tên}` cho chỗ app tự điền).
