import { hashString, seededRandom } from "./random";
import type { Gender } from "./types";

export type HairStyle =
  | "short"
  | "side"
  | "spiky"
  | "buzz"
  | "curly"
  | "bob"
  | "ponytail"
  | "twin"
  | "bun"
  | "long";

export type Accessory =
  | "none"
  | "glasses"
  | "cap"
  | "scarf"
  | "headband"
  | "bow";

export interface Appearance {
  skin: string;
  hairStyle: HairStyle;
  hairColor: string;
  shirt: string;
  bottom: "pants" | "skirt";
  bottomColor: string;
  shoe: string;
  accessory: Accessory;
  accessoryColor: string;
  backpack: boolean;
  bagColor: string;
  blush: boolean;
  /** Hạt giống ổn định cho vị trí / tốc độ trong scene. */
  seed: number;
}

const SKIN = ["#FFD9B8", "#F8C8A0", "#EDB88C", "#DDA374", "#FCE3CF"];
const HAIR = ["#2A2018", "#3B2A1E", "#51361F", "#1D1A2B", "#6B4426", "#14110F"];
const SHIRT = ["#FFFFFF", "#FFFFFF", "#FFFFFF", "#EAF4FF", "#FFF7E6"];
const PANTS = ["#2F4B8A", "#34405E", "#3D4B6B", "#2B3A67", "#4A4F63"];
const SKIRT = ["#2F4B8A", "#7A2E48", "#34405E", "#3F6B7A"];
const SHOE = ["#2B2B35", "#F2F2F2", "#3E6FB3", "#C0453A"];
const BAG = ["#FF8A3D", "#2EC4A0", "#E8505B", "#7C5CE0", "#FFC93C", "#3E8EDE"];
const ACCESSORY_COLOR = ["#E8505B", "#FFC93C", "#2EC4A0", "#7C5CE0", "#FF8A3D"];

const MALE_HAIR: HairStyle[] = ["short", "side", "spiky", "buzz", "curly"];
const FEMALE_HAIR: HairStyle[] = ["bob", "ponytail", "twin", "bun", "long"];
const ANY_HAIR: HairStyle[] = [...MALE_HAIR, ...FEMALE_HAIR];

/**
 * Diện mạo sinh ra từ id nên không đổi giữa các lần render hay tải lại trang.
 * Giới tính chỉ làm "gợi ý" cho kiểu tóc/trang phục; không ảnh hưởng việc chọn.
 */
export function appearanceFor(id: string, gender: Gender): Appearance {
  const seed = hashString(id);
  const rnd = seededRandom(seed);
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)];

  const hairPool =
    gender === "male" ? MALE_HAIR : gender === "female" ? FEMALE_HAIR : ANY_HAIR;
  const skirtChance = gender === "female" ? 0.6 : gender === "other" ? 0.25 : 0;
  const bottom = rnd() < skirtChance ? "skirt" : "pants";

  const accRoll = rnd();
  const accessory: Accessory =
    accRoll < 0.16
      ? "glasses"
      : accRoll < 0.28
        ? "cap"
        : accRoll < 0.5
          ? "scarf"
          : accRoll < 0.6
            ? gender === "male"
              ? "headband"
              : "bow"
            : "none";

  return {
    skin: pick(SKIN),
    hairStyle: pick(hairPool),
    hairColor: pick(HAIR),
    shirt: pick(SHIRT),
    bottom,
    bottomColor: bottom === "skirt" ? pick(SKIRT) : pick(PANTS),
    shoe: pick(SHOE),
    accessory,
    accessoryColor: pick(ACCESSORY_COLOR),
    backpack: rnd() < 0.7,
    bagColor: pick(BAG),
    blush: rnd() < 0.7,
    seed,
  };
}

/** Nhãn ngắn gọn trên scene. Kết quả vẫn luôn hiển thị họ tên đầy đủ. */
export function shortLabel(name: string, max = 14): string {
  const full = name.trim().replace(/\s+/g, " ");
  if (full.length <= max) return full;
  const words = full.split(" ");
  if (words.length >= 3) {
    const first = words[0];
    const last = words[words.length - 1];
    const mids = words
      .slice(1, -1)
      .map((w) => w[0]?.toUpperCase() + ".")
      .join("");
    const abbreviated = `${first} ${mids} ${last}`;
    if (abbreviated.length <= max) return abbreviated;
    const firstLast = `${first[0]}. ${last}`;
    if (firstLast.length <= max) return firstLast;
    return last.length <= max ? last : last.slice(0, max - 1) + "…";
  }
  return full.slice(0, max - 1) + "…";
}
