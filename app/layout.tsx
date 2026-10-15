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
  title: "UFO kiểm tra bài cũ",
  description:
    "Ứng dụng chọn ngẫu nhiên học sinh kiểm tra bài cũ bằng hoạt cảnh UFO vui nhộn, hỗ trợ quản lý lớp và lưu dữ liệu ngay trên trình duyệt.",
  applicationName: "UFO kiểm tra bài cũ",
  keywords: [
    "UFO kiểm tra bài cũ",
    "kiểm tra bài cũ",
    "gọi học sinh ngẫu nhiên",
    "chọn học sinh ngẫu nhiên",
    "công cụ giáo viên",
    "quản lý lớp học",
  ],
  category: "education",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    title: "UFO kiểm tra bài cũ",
    description:
      "Chọn ngẫu nhiên học sinh kiểm tra bài cũ bằng hoạt cảnh UFO vui nhộn và quản lý lớp ngay trên trình duyệt.",
    siteName: "UFO kiểm tra bài cũ",
  },
  twitter: {
    card: "summary",
    title: "UFO kiểm tra bài cũ",
    description:
      "Chọn ngẫu nhiên học sinh kiểm tra bài cũ bằng hoạt cảnh UFO vui nhộn và quản lý lớp ngay trên trình duyệt.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#10263b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${body.variable} ${display.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
