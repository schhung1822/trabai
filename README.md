# UFO kiểm tra bài cũ

Ứng dụng web giúp giáo viên **chọn ngẫu nhiên học sinh kiểm tra bài cũ** qua hoạt cảnh UFO vui nhộn: học sinh đi dạo trên phố, UFO bay đến, chiếu chùm sáng và hút từng bạn được chọn lên tàu.

- Chạy **hoàn toàn trên trình duyệt**: không tài khoản, không backend, không gửi danh sách học sinh đi đâu cả.
- Dữ liệu (lớp, học sinh, thiết lập, lịch sử) lưu trong `localStorage` của trình duyệt đang dùng.
- Toàn bộ giao diện bằng tiếng Việt có dấu.

## Chạy ứng dụng

Yêu cầu Node.js 20+.

```bash
npm install
npm run dev        # http://localhost:3000
```

Các lệnh khác:

```bash
npm run build      # build production (kèm kiểm tra TypeScript)
npm start          # chạy bản production sau khi build
npm run typecheck  # tsc --noEmit
npm run lint       # ESLint
npm test           # Vitest: chọn ngẫu nhiên, vòng không lặp, import, store, state machine
```

Lần đầu mở, ứng dụng tạo sẵn **lớp demo 20 học sinh** để xem hoạt cảnh ngay. Bạn có thể xóa hoặc thay bằng danh sách thật.

## Hướng dẫn sử dụng

### 1. Nhập danh sách lớp

Mở **Danh sách học sinh → Nhập từ Excel / Sheet**:

1. **Chọn file** `.xlsx`, `.xls`, `.csv` (kéo thả được), hoặc **dán** bảng đã copy từ Excel / Google Sheets. Có nút **Tải file Excel mẫu** (các cột `STT`, `Họ tên`, `Giới tính`).
2. **Xem trước**: ứng dụng tự nhận diện dòng tiêu đề và các cột. Tên cột được nhận diện gồm
   - STT: `STT`, `Số thứ tự`, `No.`
   - Họ tên: `Họ tên`, `Họ và tên`, `Tên học sinh`, `Full name`
   - Giới tính: `Giới tính`, `Gender`, `Sex`

   Nếu không nhận diện được, hãy chọn lại cột và dòng tiêu đề ở phần trên. File có nhiều sheet thì chọn worksheet cần nhập.
3. Mỗi dòng được báo **hợp lệ / cảnh báo / lỗi**:
   - Thiếu họ tên → lỗi, dòng bị bỏ qua.
   - Trùng STT hoặc trùng họ tên → chỉ **cảnh báo**, không tự xóa (có thể là hai bạn khác nhau).
   - Thiếu STT → tự gán số tiếp theo chưa dùng. Giới tính `Nam/Nữ`, `Male/Female`, `M/F` được chuẩn hóa; để trống thì là “Chưa rõ”.
4. Chọn **Thêm vào danh sách** hoặc **Thay thế danh sách**. Thay thế luôn yêu cầu xác nhận lần nữa để tránh mất danh sách đang dùng.
5. Xác nhận nhập; ứng dụng báo số dòng thành công / bị bỏ qua.

Bạn cũng có thể thêm, sửa, xóa từng học sinh, tìm theo tên (không cần gõ dấu) hoặc STT, và đánh dấu **vắng** (học sinh vắng không xuất hiện trong scene và không bị chọn).

> Hai học sinh trùng tên vẫn là hai người độc lập: ứng dụng nhận diện bằng `id` nội bộ, không bằng tên hay STT.

### 2. Gọi bài

1. Bấm **Khởi động UFO** (hoặc phím **Space** khi không đang nhập liệu).
2. Kết quả được **chốt ngay một lần** lúc bắt đầu (lấy mẫu không hoàn lại Fisher–Yates với `crypto.getRandomValues`, mỗi bạn đủ điều kiện có xác suất như nhau). Hoạt cảnh chỉ biểu diễn kết quả đó.
3. Chuỗi hoạt cảnh: `idle → arriving → scanning → abducting → revealing → completed` — UFO bay vào, trời tối nhẹ, chùm sáng chiếu xuống, hút lần lượt từng bạn (bộ đếm trên UFO tăng 0/2 → 1/2 → 2/2), rồi bay đi.
   Có hai **hiệu ứng hút** (chọn ngay trên thanh điều khiển hoặc trong Thiết lập, lưu lại cho lần sau):
   - **Bắt lẻ** (mặc định): mỗi lần nhắm kéo dài khoảng 2 giây. UFO có thể nhắm hụt một bạn rồi thử lại; chỉ lượt thành công mới tăng bộ đếm cho tới khi đủ số người đã chốt.
   - **Bao vây**: UFO đứng giữa trời, chùm sáng mở rộng chiếu cả lớp. Mỗi lượt hút khoảng 5 giây để các bạn hoảng loạn chạy về vật bám trước khi đèn rọi riêng kéo bạn được chọn lên.
   - Ở cả hai hiệu ứng, học sinh tìm **đạo cụ gần nhất có thể bám** trong template (đèn, biển báo, cây, cột cờ, cột bóng rổ hoặc cọc chắn). Bạn bị chọn sẽ bám chặt, vung chân rồi tuột tay mới bị hút lên; các bạn còn lại cũng đổi nét mặt và chạy tìm chỗ bám khi ở trong tia sáng.
4. Bảng **“Mời các bạn lên trả bài!”** hiện danh sách đầy đủ (avatar, STT, họ tên) với nút **Gọi lượt tiếp theo** và **Đóng**.
5. **Bỏ qua hoạt cảnh** nhảy thẳng tới kết quả đã chốt (không chọn lại). Tải lại trang giữa chừng sẽ khôi phục đúng kết quả, không mất hay tạo thêm lượt.
6. Trong lúc UFO chạy, nút Bắt đầu bị khóa và không thể sửa lớp / danh sách / thiết lập.

**Chế độ trình chiếu**: nút *Toàn màn hình* (Fullscreen API; nơi không hỗ trợ thì dùng bố cục trình chiếu bằng CSS). Thoát bằng nút **Thoát toàn màn hình** hoặc phím Esc.

### 3. Thiết lập

| Mục | Ý nghĩa |
| --- | --- |
| Số người gọi mỗi lượt | Mặc định 2. Từ 1 đến số học sinh có mặt; vượt mức sẽ báo lỗi, yêu cầu điều chỉnh. |
| Không gọi lặp trong cùng một vòng | Mặc định bật. Bạn đã được gọi sẽ không được chọn lại cho đến khi bắt đầu vòng mới. |
| Hiệu ứng hút người | Bắt lẻ / Bao vây (xem phần Gọi bài). Không đổi được khi UFO đang chạy. |
| Thời lượng hoạt cảnh | Nhanh / Bình thường / Chậm. |
| Âm thanh | Nhạc nền nhẹ và hiệu ứng, tạo bằng Web Audio (không cần file). Chỉ phát sau khi bạn tương tác với trang. |
| Bong bóng thoại vui | Học sinh nói vài câu dí dỏm khi UFO quét qua. |

**Bắt đầu vòng mới** (có xác nhận) đưa tất cả học sinh đã gọi trở lại danh sách đủ điều kiện. Khi không đủ người cho lượt tiếp theo, ứng dụng **không tự chọn trùng hay tự reset**; nó hỏi bạn: *Gọi số học sinh còn lại* hoặc *Bắt đầu vòng mới*.

### 4. Phím tắt & trợ năng

- **Space**: khởi động UFO khi đang rảnh (không kích hoạt khi đang gõ vào ô nhập hoặc đang mở hộp thoại).
- **Esc**: đóng hộp thoại hiện tại.
- Hộp thoại dùng phần tử `<dialog>` gốc (giữ focus, đóng bằng bàn phím), mọi nút đều có nhãn và vòng focus rõ.
- Hỗ trợ `prefers-reduced-motion`: hoạt cảnh rút gọn, kết quả vẫn đầy đủ. Kết quả luôn có dạng danh sách văn bản, không phụ thuộc vào việc xem scene.

## Template

Có 3 template dùng chung danh sách, thuật toán chọn và kết quả:

1. **UFO gọi bài** (mặc định): phố Việt Nam với Bánh mì, Trà sữa, Hớt tóc, Bún chả…, xe máy, ô tô, cây, đèn đường. UFO bay vào từ trên xuống.
2. **Sân trường UFO**: sân trường có cột cờ, cây phượng, sân bóng rổ. UFO bay vào từ bên trái.
3. **Phố hoàng hôn**: phố cổ dưới hoàng hôn cam tím, đèn lồng, xe đẩy hàng rong. UFO bay vào từ bên phải.

### Thêm template mới

1. Tạo file trong `templates/`, ví dụ `templates/my-template.tsx`, xuất một đối tượng `SceneTemplate` (xem `templates/types.ts`):

   ```tsx
   export const myTemplate: SceneTemplate = {
     id: "my-template",               // id ổn định, được lưu trong localStorage
     name: "Tên hiển thị",
     description: "Mô tả ngắn cho thẻ chọn template.",
     palette: { sky: "#…", ground: "#…", accent: "#…" },
     lanes: [{ y: 600, scale: 0.7 }, /* … xa → gần */],   // các làn đi bộ của nhân vật
     grabPoints: [                       // đạo cụ thật để học sinh chạy tới bám
       { id: "lamp-a", kind: "lamp", x: 300, y: 600, scale: 0.7 },
     ],
     fx: {                            // cấu hình hiệu ứng
       night: { color: "#0B1D3D", opacity: 0.45 },        // mức "tối nhẹ" khi UFO đến
       arrive: "top", leave: "top", hoverY: 150,          // "top" | "left" | "right"
       beam: { core: "#9BFFDC", edge: "#4EE3B5", glow: "#B9FFE7" },
       ufo: { body: "#C3D1E2", bodyDark: "#6F86A6", dome: "#8FE9D0", light1: "#FFD43B", light2: "#FF8A3D" },
     },
     Background: MyBackground,        // vẽ phía sau nhân vật (SVG trong hệ toạ độ 1600×900)
     Foreground: MyForeground,        // vẽ phía trước nhân vật (cây, cột đèn ở rìa)
     Lights: MyLights,                // ánh sáng chỉ hiện khi trời tối
   };
   ```

   Các thành phần vẽ nhận prop `idp` (tiền tố id gradient để không trùng id khi vẽ thumbnail). Có sẵn các mảnh dùng lại trong `components/scene/decor.tsx` (cây, đèn, ô tô, xe máy, cửa hàng, cờ…).
2. Đăng ký trong `templates/index.ts` (thêm vào mảng `TEMPLATES`; phần tử đầu là mặc định).
3. Thumbnail được tự vẽ lại từ chính `Background` + `Foreground`, không cần ảnh riêng.

## Cấu trúc mã

```
app/                      layout (font tiếng Việt), trang chủ, CSS
components/
  AppShell.tsx            khung chính, nối store ↔ scene ↔ hộp thoại
  Toolbar / ControlBar    thanh công cụ, thanh điều khiển
  scene/                  Scene (SVG nhiều lớp), Avatar, Ufo, decor, TemplateThumb
  dialogs/                Học sinh, Import, Thiết lập, Template, Lịch sử, Lớp, Kết quả…
  ui/                     Modal (<dialog>), nút, switch…
lib/
  random.ts               nguồn ngẫu nhiên an toàn + Fisher–Yates
  selection.ts            tập đủ điều kiện, kế hoạch lượt, vòng gọi bài (thuần, dễ test)
  turn-machine.ts         state machine của lượt
  import/                 chuẩn hóa, nhận diện cột, đọc xlsx/csv/dán, file mẫu
  storage.ts              lưu localStorage có version + làm sạch dữ liệu
  scene-engine.ts         vòng lặp hoạt cảnh (ghi trực tiếp DOM SVG, không setState mỗi frame)
  audio.ts                âm thanh Web Audio
store/                    store trung tâm (chốt lượt nguyên tử, khóa chỉnh sửa khi đang chạy)
templates/                các template + registry
tests/                    Vitest
```

### Lưu trữ & phiên bản dữ liệu

Dữ liệu lưu ở khóa `trabai:state` với trường `version` (hiện là 1). Khi đọc, dữ liệu luôn được làm sạch và đưa qua `migrate()` trong `lib/storage.ts`; muốn đổi cấu trúc, tăng `STORAGE_VERSION` và thêm bước nâng cấp tương ứng. Nếu đọc/ghi lỗi (bị chặn, đầy bộ nhớ, JSON hỏng) ứng dụng không crash: hiện thông báo, giữ bản sao dữ liệu hỏng ở khóa `trabai:state:corrupt-backup` và tiếp tục chạy.

## Kiểm thử

- `npm test`: các bài test cho lấy mẫu công bằng (kiểm tra thống kê), không chọn người vắng, vòng không lặp, “không đủ người”, state machine, bấm liên tục, khôi phục sau tải lại, chuẩn hóa import (tên cột, giới tính, STT, trùng lặp, dữ liệu dán tiếng Việt), làm sạch dữ liệu lưu.
- Ngoài ra đã kiểm thử giao diện trên trình duyệt thật (Microsoft Edge, Playwright) cho toàn bộ luồng: nhập xlsx/csv/dán, quản lý lớp và học sinh, thiết lập, vòng không lặp, reload giữa hoạt cảnh, Space, toàn màn hình, reduced-motion, 100 học sinh, bố cục điện thoại/tablet. Các script đó nằm ngoài repo.

## Giới hạn đã biết

- Âm thanh dùng Web Audio nên chỉ có thể nghe thử trực tiếp trên trình duyệt; chưa kiểm chứng bằng tai ở mọi thiết bị.
- Fullscreen API không có trên một số trình duyệt di động (ví dụ iPhone); khi đó ứng dụng dùng bố cục trình chiếu bằng CSS.
- Lớp 100 học sinh vẫn chạy, nhưng khi máy yếu engine tự giảm tần suất cập nhật nhân vật để giữ giao diện mượt; nhãn tên sẽ dày hơn.
- Dữ liệu chỉ nằm trong trình duyệt hiện tại: đổi máy hoặc xóa dữ liệu trình duyệt sẽ mất; hãy giữ file Excel gốc làm bản sao lưu.
