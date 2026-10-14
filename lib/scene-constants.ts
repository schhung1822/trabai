/** Kích thước "thế giới" của scene (đơn vị SVG). Chiều cao cố định, chiều rộng hiển thị thay đổi theo màn hình. */
export const WORLD_W = 1600;
export const WORLD_H = 900;

export const SPEECH_LINES = [
  "Ủa, gọi ai vậy?",
  "Em thuộc bài rồi mà!",
  "Để em ôn thêm chút!",
  "Sẵn sàng trả bài!",
  "Ôi, UFO kìa!",
  "Ánh sáng gì đây ta?",
  "Em có học bài nè!",
  "Mong là không phải em…",
];

export interface LaneDef {
  /** Vị trí chân (y) của nhân vật trên lane. */
  y: number;
  /** Tỉ lệ nhân vật theo chiều sâu. */
  scale: number;
}

export type UfoArrival = "top" | "left" | "right";

export interface SceneFxConfig {
  /** Màu và độ đậm khi chuyển sang "tối nhẹ". */
  night: { color: string; opacity: number };
  /** UFO bay vào / bay đi từ đâu. */
  arrive: UfoArrival;
  leave: UfoArrival;
  hoverY: number;
  beam: { core: string; edge: string; glow: string };
  ufo: { body: string; bodyDark: string; dome: string; light1: string; light2: string };
}

/** Viewport động: chọn bề rộng nhìn thấy theo tỉ lệ khung chứa. */
export function viewBoxFor(aspect: number) {
  const vbW = Math.round(Math.min(WORLD_W, Math.max(1000, WORLD_H * aspect)));
  return { vbW, vbX: (WORLD_W - vbW) / 2 };
}
