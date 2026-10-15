"use client";

import { useId } from "react";
import { appearanceFor } from "@/lib/avatar";
import { WORLD_H, WORLD_W } from "@/lib/scene-constants";
import type { SceneTemplate } from "@/templates/types";
import { AvatarBody } from "./Avatar";
import { GrabbableProps } from "./decor";
import { Ufo } from "./Ufo";

const SAMPLE = ["thumb-a", "thumb-b", "thumb-c", "thumb-d", "thumb-e"];

/** Ảnh thu nhỏ của template: vẽ lại chính nền thật + vài nhân vật + UFO, không dùng ảnh ngoài. */
export function TemplateThumb({ template }: { template: SceneTemplate }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const { Background, Foreground, fx } = template;
  const lanes = template.lanes;
  return (
    <svg
      viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
      className="block h-full w-full"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${uid}b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={fx.beam.core} stopOpacity="0.85" />
          <stop offset="1" stopColor={fx.beam.edge} stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <Background idp={`${uid}t`} />
      <GrabbableProps points={template.grabPoints} />
      {SAMPLE.map((id, i) => {
        const lane = lanes[(i * 2 + 1) % lanes.length];
        const x = 220 + i * 290;
        return (
          <g key={id} transform={`translate(${x} ${lane.y}) scale(${lane.scale * 1.15})`}>
            <ellipse cy={1} rx={24} ry={6} fill="rgba(20,30,50,.22)" />
            <AvatarBody ap={appearanceFor(id, i % 2 ? "female" : "male")} />
          </g>
        );
      })}
      <Foreground idp={`${uid}t`} />
      <polygon points="700,190 900,190 1010,800 590,800" fill={`url(#${uid}b)`} />
      <g transform="translate(800 150) scale(1.7)">
        <Ufo fx={{ ...fx.ufo, beamCore: fx.beam.core }} idp={`${uid}u`} />
      </g>
    </svg>
  );
}
