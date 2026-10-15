export interface VisualCandidate {
  id: string;
  name: string;
}

export interface VisualAttempt {
  student: VisualCandidate;
  outcome: "miss" | "success";
}

/**
 * Chèn một số lần UFO nhắm hụt trước các lần bắt thành công.
 * Kết quả thật vẫn là `targets`; các lần hụt chỉ phục vụ hoạt cảnh.
 */
export function buildSingleAttemptPlan(
  roster: readonly VisualCandidate[],
  targets: readonly VisualCandidate[],
  random: () => number = Math.random,
): VisualAttempt[] {
  if (targets.length === 0) return [];

  const targetIds = new Set(targets.map((target) => target.id));
  const distractors = roster.filter((student) => !targetIds.has(student.id));

  for (let i = distractors.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [distractors[i], distractors[j]] = [distractors[j], distractors[i]];
  }

  const missCount = Math.min(
    distractors.length,
    3,
    Math.max(1, Math.ceil(targets.length / 2)),
  );
  const missesBefore = Array.from({ length: targets.length }, () => [] as VisualCandidate[]);
  for (let i = 0; i < missCount; i++) {
    const slot = Math.min(targets.length - 1, Math.floor(random() * targets.length));
    missesBefore[slot].push(distractors[i]);
  }

  return targets.flatMap((target, index) => [
    ...missesBefore[index].map((student) => ({ student, outcome: "miss" as const })),
    { student: target, outcome: "success" as const },
  ]);
}
