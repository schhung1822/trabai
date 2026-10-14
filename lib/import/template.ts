/** Tạo và tải file Excel mẫu (STT, Họ tên, Giới tính). */
export async function downloadTemplate(): Promise<void> {
  const XLSX = await import("xlsx");
  const aoa = [
    ["STT", "Họ tên", "Giới tính"],
    [1, "Nguyễn Văn An", "Nam"],
    [2, "Trần Thị Bích Ngọc", "Nữ"],
    [3, "Lê Minh Khôi", "Nam"],
    [4, "Phạm Thu Hà", "Nữ"],
    [5, "Hoàng Gia Bảo", ""],
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [{ wch: 6 }, { wch: 28 }, { wch: 12 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Danh sách lớp");
  XLSX.writeFile(wb, "mau-danh-sach-lop.xlsx");
}
