"use client";

import { RotateCcw, Settings2, Users } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Btn } from "@/components/ui/controls";
import type { TurnPlan } from "@/lib/selection";

/**
 * Hiện khi chưa thể bắt đầu lượt. Không bao giờ âm thầm chọn trùng hay tự reset vòng:
 * người dùng luôn là người quyết định.
 */
export function PlanDialog({
  plan,
  onClose,
  onCallRemaining,
  onNewRound,
  onOpenSettings,
  onOpenStudents,
}: {
  plan: Exclude<TurnPlan, { kind: "ready" }> | null;
  onClose: () => void;
  onCallRemaining: (count: number) => void;
  onNewRound: () => void;
  onOpenSettings: () => void;
  onOpenStudents: () => void;
}) {
  let title = "";
  let body: React.ReactNode = null;
  let actions: React.ReactNode = null;

  if (plan) {
    switch (plan.kind) {
      case "insufficient":
        title = "Không đủ học sinh cho lượt này";
        body = (
          <>
            <p>
              Bạn muốn gọi <b>{plan.count}</b> học sinh nhưng trong vòng này chỉ còn{" "}
              <b>{plan.eligible}</b> bạn chưa được gọi.
            </p>
            <p className="mt-2 text-ink-soft">
              Hãy chọn cách tiếp tục. Ứng dụng sẽ không tự động chọn trùng hay tự bắt đầu vòng mới.
            </p>
          </>
        );
        actions = (
          <>
            <Btn variant="ghost" onClick={onClose}>
              Để sau
            </Btn>
            <Btn variant="mint" onClick={onNewRound} icon={<RotateCcw className="size-5" aria-hidden />}>
              Bắt đầu vòng mới
            </Btn>
            <Btn variant="primary" onClick={() => onCallRemaining(plan.eligible)}>
              Gọi {plan.eligible} học sinh còn lại
            </Btn>
          </>
        );
        break;
      case "exhausted":
        title = "Cả lớp đã được gọi trong vòng này";
        body = (
          <p>
            Tất cả học sinh có mặt đều đã được gọi. Hãy bắt đầu một vòng mới để mọi người đủ điều kiện trở lại,
            hoặc tắt chế độ “không gọi lặp” trong Thiết lập.
          </p>
        );
        actions = (
          <>
            <Btn variant="ghost" onClick={onOpenSettings} icon={<Settings2 className="size-5" aria-hidden />}>
              Mở Thiết lập
            </Btn>
            <Btn variant="primary" onClick={onNewRound} icon={<RotateCcw className="size-5" aria-hidden />}>
              Bắt đầu vòng mới
            </Btn>
          </>
        );
        break;
      case "count-too-high":
        title = "Số người gọi quá nhiều";
        body = (
          <p>
            Bạn đặt gọi <b>{plan.count}</b> học sinh mỗi lượt, nhưng lớp chỉ có <b>{plan.present}</b> học sinh có
            mặt. Hãy giảm số người gọi xuống tối đa {plan.present}, hoặc đánh dấu thêm học sinh có mặt.
          </p>
        );
        actions = (
          <>
            <Btn variant="ghost" onClick={onOpenStudents} icon={<Users className="size-5" aria-hidden />}>
              Danh sách học sinh
            </Btn>
            <Btn variant="primary" onClick={onOpenSettings} icon={<Settings2 className="size-5" aria-hidden />}>
              Chỉnh số người gọi
            </Btn>
          </>
        );
        break;
      case "no-students":
        title = "Chưa có học sinh có mặt";
        body = (
          <p>
            Lớp hiện chưa có học sinh nào đang có mặt. Hãy thêm học sinh, nhập từ Excel, hoặc bỏ đánh dấu “vắng”.
          </p>
        );
        actions = (
          <>
            <Btn variant="ghost" onClick={onClose}>
              Đóng
            </Btn>
            <Btn variant="primary" onClick={onOpenStudents} icon={<Users className="size-5" aria-hidden />}>
              Mở danh sách học sinh
            </Btn>
          </>
        );
        break;
    }
  }

  return (
    <Modal open={plan !== null} onClose={onClose} title={title} width={540} footer={actions}>
      <div className="text-[15px] font-semibold leading-relaxed">{body}</div>
    </Modal>
  );
}
