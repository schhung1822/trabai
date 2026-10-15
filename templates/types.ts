import type { ComponentType } from "react";
import type { GrabPoint, LaneDef, SceneFxConfig } from "@/lib/scene-constants";

/** Props chung cho các lớp nền: `idp` là tiền tố id gradient để tránh trùng id khi vẽ thumbnail. */
export interface LayerProps {
  idp: string;
}

/**
 * Một template = nền + bảng màu + cấu hình hiệu ứng.
 * Danh sách học sinh, thuật toán chọn và kết quả dùng chung giữa mọi template.
 * Để thêm template: tạo file trong /templates, rồi đăng ký ở templates/index.ts.
 */
export interface SceneTemplate {
  id: string;
  name: string;
  description: string;
  /** Màu chủ đạo cho thẻ chọn template và UI. */
  palette: { sky: string; ground: string; accent: string };
  /** Các làn đi bộ của nhân vật (xa → gần). */
  lanes: LaneDef[];
  /** Đạo cụ hiện hữu để học sinh tìm vật gần nhất và bám khi UFO hút. */
  grabPoints: GrabPoint[];
  /** Hiệu ứng: tối nhẹ, hướng UFO bay, màu chùm sáng. */
  fx: SceneFxConfig;
  /** Lớp nền phía sau nhân vật. */
  Background: ComponentType<LayerProps>;
  /** Lớp trang trí phía trước nhân vật (cây, cột đèn ở rìa). */
  Foreground: ComponentType<LayerProps>;
  /** Ánh sáng chỉ hiện khi trời tối (đèn, cửa sổ phát sáng). */
  Lights: ComponentType<LayerProps>;
}
