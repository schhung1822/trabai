/** Hàm trả về số nguyên ngẫu nhiên đều trong [0, max). */
export type RandomInt = (max: number) => number;

/**
 * Nguồn ngẫu nhiên mật mã (crypto.getRandomValues) với rejection sampling
 * để loại bỏ modulo bias: mọi giá trị trong [0, max) có xác suất bằng nhau.
 */
export const secureRandomInt: RandomInt = (max) => {
  if (!Number.isInteger(max) || max <= 0 || max > 0x100000000) {
    throw new RangeError(`secureRandomInt: max không hợp lệ (${max})`);
  }
  const cryptoObj = globalThis.crypto;
  if (!cryptoObj?.getRandomValues) {
    // Môi trường rất cũ: vẫn đảm bảo đều nhưng kém an toàn hơn.
    return Math.floor(Math.random() * max);
  }
  const buf = new Uint32Array(1);
  const limit = 0x100000000 - (0x100000000 % max);
  let x: number;
  do {
    cryptoObj.getRandomValues(buf);
    x = buf[0];
  } while (x >= limit);
  return x % max;
};

/**
 * Lấy mẫu không hoàn lại `count` phần tử bằng Fisher–Yates từng phần.
 * Không làm thay đổi mảng đầu vào. Mỗi tập con có thứ tự đều có xác suất như nhau.
 */
export function sampleWithoutReplacement<T>(
  items: readonly T[],
  count: number,
  randomInt: RandomInt = secureRandomInt,
): T[] {
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError(`count không hợp lệ (${count})`);
  }
  if (count > items.length) {
    throw new RangeError(
      `Không thể chọn ${count} phần tử từ ${items.length} phần tử`,
    );
  }
  const pool = items.slice();
  for (let i = 0; i < count; i++) {
    const j = i + randomInt(pool.length - i);
    const tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }
  return pool.slice(0, count);
}

/** Băm chuỗi thành số 32-bit (xmur3) – dùng cho hình dạng nhân vật ổn định theo id. */
export function hashString(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

/** PRNG xác định (mulberry32), chỉ dùng cho yếu tố thị giác, KHÔNG dùng để chọn học sinh. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function newId(prefix = "id"): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return `${prefix}_${c.randomUUID()}`;
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}
