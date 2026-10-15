"use client";

import {
  Maximize2,
  Menu,
  Palette,
  Settings,
  Users,
  Volume2,
  VolumeX,
  FolderCog,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Modal } from "@/components/ui/Modal";
import { Btn, inputCls } from "@/components/ui/controls";
import type { ClassRoom } from "@/lib/types";

interface ToolbarProps {
  classes: ClassRoom[];
  activeClassId: string;
  templateName: string;
  soundOn: boolean;
  locked: boolean;
  onSelectClass: (id: string) => void;
  onManageClasses: () => void;
  onTemplates: () => void;
  onStudents: () => void;
  onSettings: () => void;
  onToggleSound: () => void;
  onFullscreen: () => void;
}

export function Toolbar(p: ToolbarProps) {
  const [menu, setMenu] = useState(false);

  const classSelect = (suffix: string) => (
    <div className="flex min-w-0 items-center gap-1.5">
      <label htmlFor={`class-select-${suffix}`} className="sr-only">
        Chọn lớp
      </label>
      <select
        id={`class-select-${suffix}`}
        value={p.activeClassId}
        disabled={p.locked}
        onChange={(e) => p.onSelectClass(e.target.value)}
        className={`${inputCls} !min-h-9 !w-auto min-w-0 max-w-44 !rounded-xl !px-2.5 !py-1 text-sm font-extrabold shadow-[0_2px_0_var(--line)] sm:max-w-52`}
      >
        {p.classes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <Btn
        variant="ghost"
        size="icon"
        className="!size-9 !rounded-xl !shadow-[0_2px_0_var(--line)]"
        disabled={p.locked}
        onClick={p.onManageClasses}
        aria-label="Quản lý lớp: tạo, đổi tên, xóa"
        title="Quản lý lớp"
      >
        <FolderCog className="size-5" aria-hidden />
      </Btn>
    </div>
  );

  const item = (label: string, icon: ReactNode, onClick: () => void, opts?: { disabled?: boolean; pressed?: boolean }) => (
    <Btn
      variant="ghost"
      size="icon"
      className="!size-9 !rounded-xl !shadow-[0_2px_0_var(--line)]"
      onClick={onClick}
      disabled={opts?.disabled}
      aria-label={label}
      aria-pressed={opts?.pressed}
      title={label}
    >
      {icon}
    </Btn>
  );

  const soundIcon = p.soundOn ? <Volume2 className="size-4.5" aria-hidden /> : <VolumeX className="size-4.5" aria-hidden />;

  return (
    <>
      {/* Máy tính / tablet ngang */}
      <nav aria-label="Công cụ" className="hidden items-center gap-1.5 md:flex short:hidden">
        {classSelect("desktop")}
        {item(`Template: ${p.templateName}`, <Palette className="size-4.5" aria-hidden />, p.onTemplates, { disabled: p.locked })}
        {item("Danh sách học sinh", <Users className="size-4.5" aria-hidden />, p.onStudents, { disabled: p.locked })}
        {item("Thiết lập", <Settings className="size-4.5" aria-hidden />, p.onSettings, { disabled: p.locked })}
        <Btn
          variant={p.soundOn ? "mint" : "ghost"}
          size="icon"
          className="!size-9 !rounded-xl !shadow-[0_2px_0_var(--line)]"
          onClick={p.onToggleSound}
          aria-pressed={p.soundOn}
          aria-label={p.soundOn ? "Tắt âm thanh" : "Bật âm thanh"}
          title={p.soundOn ? "Âm thanh đang bật" : "Âm thanh đang tắt"}
        >
          {soundIcon}
        </Btn>
        {item("Toàn màn hình", <Maximize2 className="size-4.5" aria-hidden />, p.onFullscreen)}
      </nav>

      {/* Điện thoại / tablet dọc */}
      <nav aria-label="Công cụ" className="flex min-w-0 items-center gap-1.5 md:hidden short:flex">
        {classSelect("mobile")}
        <div className="flex items-center gap-1.5">
          <Btn
            variant={p.soundOn ? "mint" : "ghost"}
            size="icon"
            className="!size-9 !rounded-xl !shadow-[0_2px_0_var(--line)]"
            onClick={p.onToggleSound}
            aria-pressed={p.soundOn}
            aria-label={p.soundOn ? "Tắt âm thanh" : "Bật âm thanh"}
          >
            {soundIcon}
          </Btn>
          <Btn
            variant="primary"
            size="icon"
            className="!size-9 !rounded-xl !shadow-[0_2px_0_var(--line)]"
            onClick={() => setMenu(true)}
            aria-label="Mở menu công cụ"
            title="Menu công cụ"
          >
            <Menu className="size-4.5" aria-hidden />
          </Btn>
        </div>
      </nav>

      <Modal open={menu} onClose={() => setMenu(false)} title="Công cụ" width={480}>
        <div className="grid gap-3">
          {(
            [
              ["Danh sách học sinh", <Users key="u" className="size-6" aria-hidden />, p.onStudents, p.locked],
              [`Template: ${p.templateName}`, <Palette key="p" className="size-6" aria-hidden />, p.onTemplates, p.locked],
              ["Thiết lập", <Settings key="s" className="size-6" aria-hidden />, p.onSettings, p.locked],
              ["Quản lý lớp", <FolderCog key="f" className="size-6" aria-hidden />, p.onManageClasses, p.locked],
              ["Toàn màn hình (xoay ngang cho đẹp)", <Maximize2 key="m" className="size-6" aria-hidden />, p.onFullscreen, false],
            ] as const
          ).map(([label, icon, fn, disabled]) => (
            <Btn
              key={label}
              size="lg"
              variant="ghost"
              className="!justify-start !text-lg"
              disabled={disabled}
              onClick={() => {
                setMenu(false);
                // chờ dialog menu đóng xong rồi mới mở dialog khác
                window.setTimeout(fn, 30);
              }}
              icon={icon}
            >
              {label}
            </Btn>
          ))}
        </div>
        <p className="mt-4 rounded-xl bg-sky/30 p-3 text-sm font-bold">
          Mẹo: xoay ngang màn hình để cảnh UFO rộng và rõ hơn.
        </p>
      </Modal>
    </>
  );
}
