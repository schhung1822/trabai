import { schoolTemplate } from "./schoolyard";
import { streetTemplate } from "./street";
import { sunsetTemplate } from "./sunset";
import type { SceneTemplate } from "./types";

/**
 * Danh sách template. Phần tử đầu tiên là mặc định.
 * Thêm template mới: tạo file trong thư mục này, xuất một `SceneTemplate`, rồi thêm vào đây.
 */
export const TEMPLATES: readonly SceneTemplate[] = [
  streetTemplate,
  schoolTemplate,
  sunsetTemplate,
];

export const DEFAULT_TEMPLATE_ID = TEMPLATES[0].id;

export function getTemplate(id: string): SceneTemplate {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}

export type { SceneTemplate } from "./types";
