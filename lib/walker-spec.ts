import { hashString, seededRandom } from "./random";
import type { LaneDef } from "./scene-constants";

export interface WalkerSpec {
  laneIdx: number;
  /** Vị trí chân (đã cộng nhiễu nhỏ để các nhân vật cùng lane không thẳng hàng). */
  y: number;
  laneScale: number;
  /** Tốc độ ở tỉ lệ 1 (đơn vị thế giới / giây). */
  speed: number;
  dir: 1 | -1;
  phase: number;
  /** Vị trí ngang khởi đầu, 0..1 trên bề rộng thế giới. */
  xFrac: number;
  /** 0..2: nâng nhãn lên các độ cao khác nhau để giảm chồng chữ. */
  lift: number;
  /** Nhịp bước chân (rad/s). */
  stride: number;
}

/** Chia `n` người vào các lane theo tỉ lệ độ lớn lane (lane gần camera chứa nhiều người hơn). */
function laneQuotas(n: number, lanes: readonly LaneDef[]): number[] {
  const total = lanes.reduce((s, l) => s + l.scale, 0);
  const raw = lanes.map((l) => (n * l.scale) / total);
  const quota = raw.map(Math.floor);
  let left = n - quota.reduce((a, b) => a + b, 0);
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac || b.i - a.i);
  for (let k = 0; left > 0; k = (k + 1) % order.length, left--) quota[order[k].i]++;
  return quota;
}

/**
 * Thông số đi dạo cho cả lớp. Mỗi nhân vật có vị trí/tốc độ/hướng riêng, ổn định theo id
 * (không đổi giữa các lần render), còn lane và vị trí xuất phát được rải đều để hạn chế chồng nhãn tên.
 */
export function buildWalkerSpecs(
  ids: readonly string[],
  lanes: readonly LaneDef[],
): Map<string, WalkerSpec> {
  const sorted = ids
    .map((id) => ({ id, h: hashString(id) }))
    .sort((a, b) => a.h - b.h || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const quota = laneQuotas(sorted.length, lanes);

  const out = new Map<string, WalkerSpec>();
  let cursor = 0;
  lanes.forEach((lane, laneIdx) => {
    const members = sorted.slice(cursor, cursor + quota[laneIdx]);
    cursor += quota[laneIdx];
    const m = members.length;
    members.forEach((mem, k) => {
      const rnd = seededRandom((mem.h ^ 0x9e3779b9) >>> 0);
      const jitter = (rnd() - 0.5) * 0.5;
      const stagger = (laneIdx * 0.5) / Math.max(1, m);
      const xFrac = (((k + 0.5 + jitter) / m + stagger) % 1 + 1) % 1;
      out.set(mem.id, {
        laneIdx,
        y: lane.y + (rnd() - 0.5) * 14,
        laneScale: lane.scale,
        speed: 22 + rnd() * 38,
        dir: (k + laneIdx) % 2 === 0 ? 1 : -1,
        phase: rnd() * Math.PI * 2,
        xFrac,
        lift: (k + laneIdx) % 3,
        stride: 8 + rnd() * 2.5,
      });
    });
  });
  return out;
}
