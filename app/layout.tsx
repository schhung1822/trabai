import type { Metadata, Viewport } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import "./globals.css";

const body = Nunito({
  variable: "--f-body",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

const display = Baloo_2({
  variable: "--f-display",
  subsets: ["latin", "vietnamese"],
  weight: ["600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "App Trả Bài – UFO gọi bài",
  description:
    "Chọn ngẫu nhiên học sinh kiểm tra bài cũ qua hoạt cảnh UFO vui nhộn. Chạy hoàn toàn trên trình duyệt, danh sách lớp không rời khỏi máy của bạn.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fff8ec",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${body.variable} ${display.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
