import { LABEL_BASE_Y } from "@/components/scene/Avatar";
import { buildSingleAttemptPlan, type VisualAttempt } from "./abduction-plan";
import {
  SPEECH_LINES,
  WORLD_W,
  type GrabPoint,
  type LaneDef,
  type SceneFxConfig,
} from "./scene-constants";
import type { TurnPhase } from "./turn-machine";
import { hashString } from "./random";
import { buildWalkerSpecs, type WalkerSpec } from "./walker-spec";

/**
 * SceneEngine điều khiển hoạt cảnh trực tiếp trên DOM SVG bằng một vòng requestAnimationFrame.
 * Không có React state nào thay đổi theo từng frame; React chỉ nhận vài sự kiện mỗi lượt
 * (đổi giai đoạn, đếm số người đã hút).
 *
 * Engine KHÔNG chọn học sinh: nó nhận danh sách `targets` đã được chốt từ store và chỉ biểu diễn.
 */

export type SfxKind = "arrive" | "beamOn" | "grab" | "lift" | "pop" | "leave" | "done";

export interface EngineCallbacks {
  onPhaseDone(phase: TurnPhase): void;
  onProgress(info: { done: number; total: number; current: string | null }): void;
  sfx(kind: SfxKind): void;
}

export interface TurnTarget {
  id: string;
  name: string;
}

export type AbductMode = "single" | "siege";

export interface TurnRunOptions {
  targets: TurnTarget[];
  /** single = bắt lẻ, siege = bao vây. */
  mode: AbductMode;
  speedFactor: number;
  bubbles: boolean;
}

interface Viewport {
  vbX: number;
  vbW: number;
  /** pixel màn hình trên mỗi đơn vị thế giới. */
  ppu: number;
}

interface Walker {
  id: string;
  name: string;
  el: SVGGElement;
  flip: SVGGElement | null;
  bob: SVGGElement | null;
  legL: SVGGElement | null;
  legR: SVGGElement | null;
  armL: SVGGElement | null;
  armR: SVGGElement | null;
  faceCalm: SVGGElement | null;
  facePanic: SVGGElement | null;
  labelWrap: SVGGElement | null;
  lane: LaneDef;
  laneY: number;
  x: number;
  y: number;
  s: number;
  dir: 1 | -1;
  speed: number;
  phase: number;
  stride: number;
  lift: number;
  mode: "walk" | "react" | "gone";
  up: number;
  inBeam: boolean;
  panicX: number | null;
  bubbleCd: number;
  appliedDir: number;
}

interface Bubble {
  el: SVGGElement;
  rect: SVGRectElement;
  tail: SVGPathElement;
  text: SVGTextElement;
  walker: Walker | null;
  t: number;
  dur: number;
}

interface Seg {
  phase: TurnPhase;
  dur: number;
  lastOfPhase: boolean;
  enter?: () => void;
  update: (p: number, dt: number) => void;
  exit?: () => void;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInCubic = (t: number) => t * t * t;
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const f1 = (n: number) => n.toFixed(1);

const BEAM_HALF_TOP = 70;
const BEAM_HALF_BOTTOM = 210;
const GROUND_Y = 830;
const UFO_HATCH_Y = 42;

/** Vị trí bàn tay nắm cột (toạ độ nhân vật, hướng nhìn phải) và khoảng cách từ người đến cột. */
const GRIP_DX = 38.8;
const GRIP_Y = 83;

const GRAB_LINES = [
  "Khoan đã, em bám chắc rồi!",
  "Em chưa ôn xong mà!",
  "Giữ em với!",
  "Ối ối, đừng hút em!",
];

const MISS_LINES = ["Hụt rồi!", "Suýt nữa thì bị bắt!", "Tia hút trượt mất rồi!"];

export class SceneEngine {
  private svg: SVGSVGElement;
  private cb: EngineCallbacks;

  private walkersLayer!: SVGGElement;
  private night!: SVGRectElement;
  private lights!: SVGGElement;
  private beam!: SVGGElement;
  private beamOuter!: SVGPolygonElement;
  private beamInner!: SVGPolygonElement;
  private beamGlow!: SVGEllipseElement;
  private sparks: SVGCircleElement[] = [];
  private ufo!: SVGGElement;
  private led: SVGTextElement | null = null;
  private abductLayer!: SVGGElement;
  private hud!: SVGGElement;
  private hudBg!: SVGRectElement;
  private hudName!: SVGTextElement;
  private hudCount!: SVGTextElement;
  private bubbles: Bubble[] = [];

  private walkers = new Map<string, Walker>();
  private specs = new Map<string, WalkerSpec>();
  private fx!: SceneFxConfig;
  private lanes: LaneDef[] = [];
  private grabPoints: GrabPoint[] = [];
  private vp: Viewport = { vbX: 0, vbW: WORLD_W, ppu: 0.8 };
  private boost = 1;
  private reduced = false;

  private raf = 0;
  private last = 0;
  private prevNow = 0;
  private time = 0;
  private destroyed = false;
  /** Trung bình trượt của thời gian giữa hai frame (giây) để tự điều chỉnh độ mượt. */
  private frameEma = 1 / 60;
  /** 1 = cập nhật nhân vật mỗi frame; 2 = mỗi hai frame (khi máy yếu / lớp rất đông). */
  private walkerStride = 1;
  private frameCount = 0;
  private walkerDt = 0;

  // trạng thái hiệu ứng
  private ux = 800;
  private uy = -300;
  private tilt = 0;
  private ufoAlpha = 0;
  private beamAmt = 0;
  private footX = 800;
  private footY = GROUND_Y;
  private botW = BEAM_HALF_BOTTOM;
  private nightAmt = 0;
  private speedMul = 1;
  private hudShow = 0;
  private hudPop = 0;

  // lượt đang chạy
  private segs: Seg[] = [];
  private segIdx = -1;
  private segT = 0;
  private running = false;
  private opts: TurnRunOptions | null = null;
  private done = 0;
  private clone: SVGGElement | null = null;
  private pole: SVGGElement | null = null;
  private poleBaseTransform = "";
  private gripPoint: GrabPoint | null = null;
  private gripCenter: { x: number; y: number; rot: number } | null = null;
  /** Đèn rọi riêng xuống bạn bị chọn (chế độ bao vây). */
  private spotAmt = 0;
  private spotX = 800;
  private spotY = GROUND_Y;
  private appliedNight = -1;

  constructor(svg: SVGSVGElement, cb: EngineCallbacks) {
    this.svg = svg;
    this.cb = cb;
    this.bind();
    this.raf = requestAnimationFrame(this.tick);
  }

  /* ---------------------------------------------------------------- */
  /* Gắn DOM                                                           */
  /* ---------------------------------------------------------------- */

  private q<T extends Element>(sel: string): T {
    const el = this.svg.querySelector<T>(sel);
    if (!el) throw new Error(`SceneEngine: thiếu phần tử ${sel}`);
    return el;
  }

  private bind() {
    this.walkersLayer = this.q('[data-layer="walkers"]');
    this.night = this.q('[data-fx="night"]');
    this.lights = this.q('[data-fx="lights"]');
    this.beam = this.q('[data-fx="beam"]');
    this.beamOuter = this.q('[data-fx="beam-outer"]');
    this.beamInner = this.q('[data-fx="beam-inner"]');
    this.beamGlow = this.q('[data-fx="beam-glow"]');
    this.sparks = Array.from(this.svg.querySelectorAll<SVGCircleElement>("[data-spark]"));
    this.ufo = this.q('[data-fx="ufo"]');
    this.led = this.svg.querySelector<SVGTextElement>("[data-ufo-led]");
    this.abductLayer = this.q('[data-fx="abduct"]');
    this.hud = this.q('[data-fx="hud"]');
    this.hudBg = this.q("[data-hud-bg]");
    this.hudName = this.q("[data-hud-name]");
    this.hudCount = this.q("[data-hud-count]");
    this.bubbles = Array.from(this.svg.querySelectorAll<SVGGElement>("[data-bubble]")).map(
      (el) => ({
        el,
        rect: el.querySelector("rect") as SVGRectElement,
        tail: el.querySelector("path") as SVGPathElement,
        text: el.querySelector("text") as SVGTextElement,
        walker: null,
        t: 0,
        dur: 0,
      }),
    );
  }

  /* ---------------------------------------------------------------- */
  /* Cấu hình                                                          */
  /* ---------------------------------------------------------------- */

  configure(opts: {
    lanes: LaneDef[];
    grabPoints: GrabPoint[];
    fx: SceneFxConfig;
    viewport: Viewport;
    reducedMotion: boolean;
  }) {
    this.lanes = opts.lanes;
    this.grabPoints = opts.grabPoints;
    this.fx = opts.fx;
    this.vp = opts.viewport;
    this.reduced = opts.reducedMotion;
    this.boost = clamp(0.8 / this.vp.ppu, 1, 1.6);
    this.specs = buildWalkerSpecs(Array.from(this.walkers.keys()), this.lanes);
    for (const w of this.walkers.values()) this.layoutWalker(w);
    if (!this.running) this.restUfo();
    this.renderStaticFx();
    this.writeAllWalkers();
  }

  private get minX() {
    return this.vp.vbX;
  }
  private get maxX() {
    return this.vp.vbX + this.vp.vbW;
  }
  private get cx() {
    return this.vp.vbX + this.vp.vbW / 2;
  }
  private get us() {
    return this.boost;
  }

  /** Đồng bộ danh sách nhân vật với DOM mà React vừa render. */
  syncRoster(roster: { id: string; name: string }[]) {
    const seen = new Set<string>();
    this.specs = buildWalkerSpecs(roster.map((r) => r.id), this.lanes);
    const nodes = new Map<string, SVGGElement>();
    this.walkersLayer
      .querySelectorAll<SVGGElement>(":scope > [data-walker]")
      .forEach((el) => nodes.set(el.getAttribute("data-walker") ?? "", el));
    for (const { id, name } of roster) {
      const el = nodes.get(id);
      if (!el) continue;
      seen.add(id);
      let w = this.walkers.get(id);
      if (!w || w.el !== el) {
        const spec = this.specs.get(id)!;
        const span = this.maxX - this.minX + 200;
        w = {
          id,
          name,
          el,
          flip: null,
          bob: null,
          legL: null,
          legR: null,
          armL: null,
          armR: null,
          faceCalm: null,
          facePanic: null,
          labelWrap: null,
          lane: this.lanes[spec.laneIdx],
          laneY: spec.y,
          x: this.minX - 100 + spec.xFrac * span,
          y: spec.y,
          s: 1,
          dir: spec.dir,
          speed: spec.speed,
          phase: spec.phase,
          stride: spec.stride,
          lift: spec.lift,
          mode: "walk",
          up: 0,
          inBeam: false,
          panicX: null,
          bubbleCd: 0,
          appliedDir: 0,
        };
        this.walkers.set(id, w);
      }
      w.name = name;
      w.flip = el.querySelector('[data-role="flip"]');
      w.bob = el.querySelector('[data-role="bob"]');
      w.legL = el.querySelector('[data-role="legL"]');
      w.legR = el.querySelector('[data-role="legR"]');
      w.armL = el.querySelector('[data-role="armL"]');
      w.armR = el.querySelector('[data-role="armR"]');
      w.faceCalm = el.querySelector('[data-role="faceCalm"]');
      w.facePanic = el.querySelector('[data-role="facePanic"]');
      w.labelWrap = el.querySelector('[data-role="labelWrap"]');
      this.layoutWalker(w);
      this.writeWalker(w);
    }
    for (const id of Array.from(this.walkers.keys())) {
      if (!seen.has(id)) this.walkers.delete(id);
    }
  }

  /** Tính lại lane / tỉ lệ / nhãn khi đổi template hay kích thước. */
  private layoutWalker(w: Walker) {
    const spec = this.specs.get(w.id);
    if (!spec) return;
    w.lane = this.lanes[spec.laneIdx];
    w.laneY = spec.y;
    w.y = spec.y;
    w.s = spec.laneScale * Math.min(this.boost, 1.4);
    w.speed = spec.speed;
    w.lift = spec.lift;
    const k = clamp(12.5 / (15 * w.s * this.vp.ppu), 0.85, 3);
    const lift = w.lift * 30 * k;
    w.labelWrap?.setAttribute(
      "transform",
      `translate(0 ${f1(-LABEL_BASE_Y - 19 * k - lift)}) scale(${k.toFixed(3)})`,
    );
    if (this.reduced) {
      // Tư thế tĩnh: giữ nhân vật đứng yên, rải đều.
      w.phase = 0;
    }
  }

  private writeAllWalkers() {
    for (const w of this.walkers.values()) this.writeWalker(w);
  }

  private writeWalker(w: Walker, jump = 0) {
    const sw = Math.sin(w.phase);
    const walking = !this.reduced || w.mode === "react";
    const panicking = w.mode === "react";
    const legA = walking ? sw * 28 : 0;
    const armA = walking ? -sw * 24 : 0;
    const bobY = walking ? -Math.abs(sw) * 3.2 : 0;
    let aL = armA;
    let aR = -armA;
    if (w.up > 0.01) {
      const wave = Math.sin(this.time * 12 + w.phase) * 14;
      aL = lerp(armA, 152 + wave, w.up);
      aR = lerp(-armA, -(152 - wave), w.up);
    }
    w.el.setAttribute(
      "transform",
      `translate(${f1(w.x)} ${f1(w.y - jump)}) scale(${w.s.toFixed(3)})`,
    );
    if (w.appliedDir !== w.dir && w.flip) {
      w.flip.setAttribute("transform", w.dir < 0 ? "scale(-1 1)" : "");
      w.appliedDir = w.dir;
    }
    w.legL?.setAttribute("transform", `rotate(${f1(legA)})`);
    w.legR?.setAttribute("transform", `rotate(${f1(-legA)})`);
    w.armL?.setAttribute("transform", `rotate(${f1(aL)})`);
    w.armR?.setAttribute("transform", `rotate(${f1(aR)})`);
    w.bob?.setAttribute("transform", `translate(0 ${f1(bobY)})`);
    if (w.faceCalm) w.faceCalm.style.display = panicking ? "none" : "";
    if (w.facePanic) w.facePanic.style.display = panicking ? "" : "none";
  }

  /* ---------------------------------------------------------------- */
  /* Vòng lặp                                                          */
  /* ---------------------------------------------------------------- */

  private tick = (now: number) => {
    if (this.destroyed) return;
    this.raf = requestAnimationFrame(this.tick);
    if (!this.fx) return; // chưa configure
    const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 0.016;
    this.last = now;
    this.time += dt;

    // Tự giảm tần suất vẽ nhân vật nếu khung hình chậm (vd. 100 học sinh trên máy yếu).
    const raw = (now - this.prevNow) / 1000;
    this.prevNow = now;
    if (raw > 0 && raw < 0.25) {
      this.frameEma = this.frameEma * 0.95 + raw * 0.05;
      if (this.frameEma > 0.024 && this.walkerStride === 1 && this.walkers.size > 40) this.walkerStride = 2;
      else if (this.frameEma < 0.0155 && this.walkerStride === 2) this.walkerStride = 1;
    }

    if (this.running) this.stepTurn(dt);
    this.walkerDt += dt;
    if (++this.frameCount % this.walkerStride === 0) {
      this.stepWalkers(this.walkerDt);
      this.walkerDt = 0;
    }
    this.stepBubbles(dt);
    this.renderFx();
  };

  private stepWalkers(dt: number) {
    const margin = 110;
    const lo = this.minX - margin;
    const hi = this.maxX + margin;
    for (const w of this.walkers.values()) {
      if (w.mode === "gone") continue;
      const reacting = w.mode === "react";
      if (!this.reduced) {
        if (reacting && w.panicX !== null) {
          const dx = w.panicX - w.x;
          if (Math.abs(dx) > 2) {
            w.dir = dx > 0 ? 1 : -1;
            w.x += Math.sign(dx) * Math.min(Math.abs(dx), (125 + w.speed * 0.6) * dt);
          }
        } else {
          const mul = reacting ? 0.25 : this.speedMul;
          w.x += w.dir * w.speed * w.lane.scale * dt * mul;
          if (w.x > hi) w.x = lo;
          else if (w.x < lo) w.x = hi;
        }
        w.phase += dt * w.stride * (reacting ? 1.5 : this.speedMul > 1.05 ? 1.2 : 1);
      }
      const target = reacting ? 1 : 0;
      w.up += (target - w.up) * Math.min(1, dt * 7);
      if (w.bubbleCd > 0) w.bubbleCd -= dt;
      if (w.x < lo - 40 || w.x > hi + 40) continue;
      const jump = reacting && !this.reduced ? Math.abs(Math.sin(this.time * 8 + w.phase)) * 16 * w.s : 0;
      this.writeWalker(w, jump);
    }
  }

  /* ---------------------------------------------------------------- */
  /* Hiệu ứng UFO / chùm sáng / tối nhẹ                                 */
  /* ---------------------------------------------------------------- */

  private restUfo() {
    this.ufoAlpha = 0;
    this.beamAmt = 0;
    this.nightAmt = 0;
    this.hudShow = 0;
    this.speedMul = 1;
  }

  private renderStaticFx() {
    this.appliedNight = -1;
  }

  private renderFx() {
    // tối nhẹ
    if (Math.abs(this.nightAmt - this.appliedNight) > 0.004) {
      this.appliedNight = this.nightAmt;
      this.night.setAttribute(
        "opacity",
        (this.nightAmt * this.fx.night.opacity).toFixed(3),
      );
      this.lights.setAttribute("opacity", this.nightAmt.toFixed(3));
    }

    const showUfo = this.ufoAlpha > 0.01;
    this.ufo.setAttribute("opacity", showUfo ? this.ufoAlpha.toFixed(3) : "0");
    if (showUfo) {
      const bob = this.reduced ? 0 : Math.sin(this.time * 2.4) * 4;
      this.ufo.setAttribute(
        "transform",
        `translate(${f1(this.ux)} ${f1(this.uy + bob)}) rotate(${f1(this.tilt)}) scale(${this.us.toFixed(3)})`,
      );
    }

    // chùm sáng
    if (this.beamAmt > 0.01 && showUfo) {
      const us = this.us;
      const topY = this.uy + UFO_HATCH_Y * us;
      const flicker = this.reduced ? 1 : 0.93 + Math.sin(this.time * 17) * 0.07;
      const a = this.beamAmt;
      const tw = BEAM_HALF_TOP * us;
      const bw = this.botW * a * (0.6 + 0.4 * a);
      const fx = this.footX;
      const fy = this.footY;
      this.beamOuter.setAttribute(
        "points",
        `${f1(this.ux - tw)},${f1(topY)} ${f1(this.ux + tw)},${f1(topY)} ${f1(fx + bw)},${f1(fy)} ${f1(fx - bw)},${f1(fy)}`,
      );
      const iw = 0.5;
      if (this.spotAmt > 0.01) {
        const sh = 92 * Math.min(this.boost, 1.3);
        this.beamInner.setAttribute(
          "points",
          `${f1(this.ux - tw * iw)},${f1(topY)} ${f1(this.ux + tw * iw)},${f1(topY)} ${f1(this.spotX + sh)},${f1(this.spotY)} ${f1(this.spotX - sh)},${f1(this.spotY)}`,
        );
        this.beamInner.setAttribute("opacity", (0.28 + 0.5 * this.spotAmt).toFixed(2));
      } else {
        this.beamInner.setAttribute(
          "points",
          `${f1(this.ux - tw * iw)},${f1(topY)} ${f1(this.ux + tw * iw)},${f1(topY)} ${f1(fx + bw * iw)},${f1(fy)} ${f1(fx - bw * iw)},${f1(fy)}`,
        );
        this.beamInner.setAttribute("opacity", "0.28");
      }
      this.beamGlow.setAttribute("cx", f1(fx));
      this.beamGlow.setAttribute("cy", f1(fy));
      this.beamGlow.setAttribute("rx", f1(bw * 1.08));
      this.beamGlow.setAttribute("ry", f1(Math.min(bw * 0.2, 120)));
      this.beam.setAttribute("opacity", (a * flicker * (this.opts?.mode === "siege" ? 0.82 : 1)).toFixed(3));
      // hạt sáng bay lên trong chùm
      const n = this.sparks.length;
      for (let i = 0; i < n; i++) {
        const sp = this.sparks[i];
        const seed = i / n;
        const t = this.reduced ? seed : 1 - ((seed + this.time * 0.35 + (i % 3) * 0.17) % 1);
        const cxLine = lerp(this.ux, fx, t);
        const half = lerp(tw, bw, t) * 0.8;
        const off = Math.sin(i * 12.9898) * half;
        sp.setAttribute("cx", f1(cxLine + off));
        sp.setAttribute("cy", f1(lerp(topY, fy, t)));
        sp.setAttribute("r", f1(2.2 + (i % 3)));
        sp.setAttribute("opacity", (Math.sin(t * Math.PI) * 0.9).toFixed(2));
      }
    } else if (this.beam.getAttribute("opacity") !== "0") {
      this.beam.setAttribute("opacity", "0");
    }

    // bảng thông tin trên UFO
    if (this.hudShow > 0.01 && showUfo) {
      const us = this.us;
      const k = clamp(14 / (16 * this.vp.ppu), 0.9, 2.6);
      const half = (parseFloat(this.hudBg.getAttribute("width") ?? "200") / 2) * k;
      const x = clamp(this.ux, this.minX + half + 6, this.maxX - half - 6);
      const y = Math.max(34 * k + 8, this.uy - 104 * us - 20 - 28 * k);
      const pop = 1 + Math.sin(this.hudPop * Math.PI) * 0.12;
      this.hud.setAttribute(
        "transform",
        `translate(${f1(x)} ${f1(y)}) scale(${(k * pop).toFixed(3)})`,
      );
      this.hud.setAttribute("opacity", Math.min(1, this.hudShow).toFixed(2));
      if (this.hudPop > 0) this.hudPop = Math.max(0, this.hudPop - 0.05);
    } else if (this.hud.getAttribute("opacity") !== "0") {
      this.hud.setAttribute("opacity", "0");
    }
  }

  private setHud(name: string | null, done: number, total: number) {
    const idle = this.opts?.mode === "siege" ? "UFO đang bao vây cả lớp…" : "UFO đang quét…";
    const label = name ? `Đang hút: ${name}` : done >= total ? "Hoàn thành!" : idle;
    this.hudName.textContent = label;
    this.hudCount.textContent = `Đã gọi ${done}/${total}`;
    const w = clamp(label.length * 9.6 + 44, 200, 440);
    this.hudBg.setAttribute("width", f1(w));
    this.hudBg.setAttribute("x", f1(-w / 2));
    if (this.led) this.led.textContent = `${done}/${total}`;
  }

  /* ---------------------------------------------------------------- */
  /* Bong bóng thoại                                                    */
  /* ---------------------------------------------------------------- */

  private spawnBubble(w: Walker, forced?: string, urgent = false) {
    if (!this.opts?.bubbles) return;
    // Câu thoại "bám víu" được ưu tiên: dùng chỗ trống hoặc chiếm bong bóng đầu tiên.
    const free = this.bubbles.find((b) => !b.walker) ?? (urgent ? this.bubbles[0] : undefined);
    if (!free || (!urgent && w.bubbleCd > 0)) return;
    const line = forced ?? SPEECH_LINES[Math.floor(Math.random() * SPEECH_LINES.length)];
    free.walker = w;
    free.t = 0;
    free.dur = forced ? 2.4 : 1.9 + Math.random() * 0.8;
    free.text.textContent = line;
    const width = line.length * 7.2 + 24;
    free.rect.setAttribute("x", f1(-width / 2));
    free.rect.setAttribute("width", f1(width));
    w.bubbleCd = 4;
  }

  private stepBubbles(dt: number) {
    for (const b of this.bubbles) {
      const w = b.walker;
      if (!w) {
        if (b.el.getAttribute("opacity") !== "0") b.el.setAttribute("opacity", "0");
        continue;
      }
      b.t += dt;
      if (b.t >= b.dur || w.mode === "gone") {
        b.walker = null;
        continue;
      }
      const k = clamp(12.5 / (14 * this.vp.ppu), 0.9, 2.8);
      const fade = Math.min(1, b.t / 0.18, (b.dur - b.t) / 0.25);
      const labelK = clamp(12.5 / (15 * w.s * this.vp.ppu), 0.85, 3);
      const topOfLabel = (LABEL_BASE_Y + 40 * labelK + w.lift * 30 * labelK) * w.s;
      const half = parseFloat(b.rect.getAttribute("width") ?? "120") / 2 * k;
      const x = clamp(w.x, this.minX + half + 4, this.maxX - half - 4);
      b.el.setAttribute(
        "transform",
        `translate(${f1(x)} ${f1(w.y - topOfLabel)}) scale(${k.toFixed(3)})`,
      );
      b.el.setAttribute("opacity", fade.toFixed(2));
    }
  }

  /* ---------------------------------------------------------------- */
  /* Lượt gọi bài                                                       */
  /* ---------------------------------------------------------------- */

  isRunning() {
    return this.running;
  }

  runTurn(opts: TurnRunOptions) {
    if (this.running) return;
    this.opts = opts;
    this.running = true;
    this.done = 0;
    this.segs = this.buildSegments(opts);
    this.segIdx = -1;
    this.advanceSeg();
  }

  private advanceSeg() {
    const prev = this.segs[this.segIdx];
    prev?.exit?.();
    this.segIdx++;
    this.segT = 0;
    const seg = this.segs[this.segIdx];
    if (!seg) return;
    seg.enter?.();
  }

  private stepTurn(dt: number) {
    const seg = this.segs[this.segIdx];
    if (!seg) return;
    this.segT += dt;
    const p = clamp(this.segT / seg.dur, 0, 1);
    seg.update(p, dt);
    if (p >= 1) {
      const finished = seg;
      this.advanceSeg();
      if (finished.lastOfPhase) {
        const phase = finished.phase;
        if (this.segIdx >= this.segs.length) this.endTurn();
        this.cb.onPhaseDone(phase);
      }
    }
  }

  private endTurn() {
    this.running = false;
    this.opts = null;
    this.cleanup();
  }

  /** Dựng chuỗi đoạn hoạt cảnh: arriving → scanning → (approach+lift)×N → revealing. */
  private buildSegments(opts: TurnRunOptions): Seg[] {
    const f = opts.speedFactor;
    const red = this.reduced;
    const total = opts.targets.length;
    const hy = this.fx.hoverY + (this.us - 1) * 50;
    const segs: Seg[] = [];

    /* --- arriving --- */
    const arriveFrom = () => {
      switch (this.fx.arrive) {
        case "left":
          return { x: this.minX - 320, y: hy - 70 };
        case "right":
          return { x: this.maxX + 320, y: hy - 70 };
        default:
          return { x: this.cx + 60, y: -280 };
      }
    };
    let from = { x: 0, y: 0 };
    segs.push({
      phase: "arriving",
      dur: (red ? 0.5 : 2.1) * (red ? 1 : f),
      lastOfPhase: true,
      enter: () => {
        from = arriveFrom();
        this.ufoAlpha = red ? 0 : 1;
        this.ux = red ? this.cx : from.x;
        this.uy = red ? hy : from.y;
        this.beamAmt = 0;
        this.setHud(null, 0, total);
        this.cb.sfx("arrive");
        this.cb.onProgress({ done: 0, total, current: null });
      },
      update: (p) => {
        const e = easeOutCubic(p);
        this.nightAmt = easeInOutCubic(p);
        this.speedMul = 1 + 0.5 * p;
        if (red) {
          this.ufoAlpha = p;
          return;
        }
        this.ux = lerp(from.x, this.cx, e);
        this.uy = lerp(from.y, hy, e) + Math.sin(p * Math.PI) * -26;
        this.tilt = (from.x < this.cx ? 1 : from.x > this.cx ? -1 : 0.6) * (1 - e) * 14;
        this.hudShow = clamp((p - 0.7) / 0.3, 0, 1);
        this.hudPop = 0;
      },
    });

    const siege = opts.mode === "siege";
    const wideW = Math.max(this.vp.vbW * 0.56, 480);

    /* --- scanning: bắt lẻ = quét qua lại; bao vây = chùm sáng mở rộng phủ cả lớp --- */
    const range = Math.min(this.vp.vbW * 0.3, 520);
    segs.push({
      phase: "scanning",
      dur: (red ? 0.6 : siege ? 3.3 : 3.0) * (red ? 1 : f),
      lastOfPhase: true,
      enter: () => {
        this.tilt = 0;
        this.hudShow = 1;
        this.setHud(null, 0, total);
        this.cb.sfx("beamOn");
      },
      update: (p) => {
        this.nightAmt = 1;
        this.beamAmt = easeOutCubic(clamp(p / 0.18, 0, 1));
        this.ufoAlpha = 1;
        if (siege) {
          const grow = easeInOutCubic(clamp((p - 0.12) / 0.55, 0, 1));
          this.botW = lerp(BEAM_HALF_BOTTOM, wideW, grow);
          this.ux = this.cx + (red ? 0 : Math.sin(p * Math.PI * 10) * 8);
          this.uy = hy + (red ? 0 : Math.sin(p * Math.PI * 4) * 6);
          this.tilt = 0;
          this.footX = this.cx;
        } else {
          this.botW = BEAM_HALF_BOTTOM * (0.9 + this.us * 0.1);
          if (!red) {
            const sweep = Math.sin(p * Math.PI * 2);
            this.ux = this.cx + range * sweep;
            this.uy = hy + Math.sin(p * Math.PI * 4) * 6;
            this.tilt = Math.cos(p * Math.PI * 2) * 6;
            this.footX = this.ux + Math.sin(p * 9) * 14;
          } else {
            this.ux = this.cx;
            this.uy = hy;
            this.footX = this.cx;
          }
        }
        this.footY = GROUND_Y;
        this.reactInBeam();
      },
      exit: () => {
        // Bao vây: cả lớp vẫn hoảng hốt trong chùm sáng; bắt lẻ: trở lại đi dạo.
        if (siege) return;
        for (const w of this.walkers.values()) {
          if (w.mode === "react") w.mode = "walk";
          w.inBeam = false;
          w.panicX = null;
        }
      },
    });

    const attempts: VisualAttempt[] = siege
      ? opts.targets.map((student) => ({ student, outcome: "success" }))
      : buildSingleAttemptPlan(
          Array.from(this.walkers.values(), ({ id, name }) => ({ id, name })),
          opts.targets,
        );
    let successIndex = 0;

    /* Bắt lẻ có thể nhắm hụt; chỉ lượt thành công mới tăng bộ đếm kết quả. */
    attempts.forEach((attempt) => {
      if (attempt.outcome === "miss") {
        const t = attempt.student;
        let w: Walker | undefined;
        let startUx = 0;
        let startFx = 0;
        let startWx = 0;
        let targetX = 0;
        let escapeX = 0;
        let announced = false;
        segs.push({
          phase: "abducting",
          dur: (red ? 0.45 : 2) * (red ? 1 : f),
          lastOfPhase: false,
          enter: () => {
            w = this.walkers.get(t.id);
            startUx = this.ux;
            startFx = this.footX;
            startWx = w?.x ?? this.cx;
            const point = w ? this.nearestGrabPoint(w) : null;
            const dir: 1 | -1 = point && point.x < startWx ? -1 : 1;
            targetX = point
              ? clamp(point.x - dir * GRIP_DX * (w?.s ?? 1), this.minX + 70, this.maxX - 70)
              : startWx;
            escapeX = clamp(targetX - dir * 110, this.minX + 50, this.maxX - 50);
            if (w) {
              w.mode = "react";
              w.panicX = null;
              w.dir = dir;
            }
            this.setHud(t.name, this.done, total);
            this.hudName.textContent = `Đang khóa mục tiêu: ${t.name}`;
            this.cb.onProgress({ done: this.done, total, current: t.name });
          },
          update: (p) => {
            this.nightAmt = 1;
            this.ufoAlpha = 1;
            this.beamAmt = p > 0.72 && !red ? 0.65 + Math.sin(this.time * 35) * 0.25 : 1;
            const lock = easeInOutCubic(clamp(p / 0.5, 0, 1));
            const flee = easeOutCubic(clamp((p - 0.58) / 0.42, 0, 1));
            const x = lerp(lerp(startWx, targetX, lock), escapeX, flee);
            if (w && !red) {
              w.x = x;
              if (flee > 0.05) w.dir = escapeX > targetX ? 1 : -1;
            }
            this.botW = lerp(BEAM_HALF_BOTTOM, 112, lock);
            this.footX = lerp(startFx, x, lock);
            this.footY = w?.y ?? GROUND_Y;
            if (!red) {
              this.ux = lerp(startUx, x, lock);
              this.uy = hy + Math.sin(p * Math.PI * 4) * 5;
              this.tilt = p > 0.6 ? Math.sin(this.time * 18) * 7 : (x - this.ux) * 0.03;
            }
            if (p > 0.58) {
              this.hudName.textContent = "Trượt mất rồi!";
              if (!announced && w) {
                announced = true;
                this.spawnBubble(w, MISS_LINES[Math.floor(Math.random() * MISS_LINES.length)], true);
              }
            }
            this.reactInBeam(w);
          },
          exit: () => {
            if (w) {
              w.mode = "walk";
              w.inBeam = false;
              w.panicX = null;
            }
            this.tilt = 0;
            this.setHud(null, this.done, total);
            this.cb.onProgress({ done: this.done, total, current: null });
          },
        });
        return;
      }

      /* --- lượt thành công: tiếp cận + bám vật gần nhất + bị hút --- */
      const t = attempt.student;
      const i = successIndex++;
      const last = successIndex === total;
      let startUx = 0;
      let startFx = 0;
      let startWx = 0;
      let tx = 0;
      let w: Walker | undefined;

      segs.push({
        phase: "abducting",
        dur: (red ? 0.3 : siege ? 1.1 : 0.42) * (red ? 1 : f),
        lastOfPhase: false,
        enter: () => {
          w = this.walkers.get(t.id);
          startUx = this.ux;
          startFx = this.footX;
          startWx = w?.x ?? this.cx;
          this.gripPoint = w ? this.nearestGrabPoint(w) : null;
          const dir: 1 | -1 = this.gripPoint && this.gripPoint.x < startWx ? -1 : 1;
          tx = this.gripPoint
            ? clamp(this.gripPoint.x - dir * GRIP_DX * (w?.s ?? 1), this.minX + 70, this.maxX - 70)
            : clamp(startWx, this.minX + 170, this.maxX - 170);
          if (w) {
            w.mode = "react";
            w.panicX = null;
            w.dir = dir;
          }
          this.setHud(t.name, this.done, total);
          this.hudShow = 1;
          this.cb.onProgress({ done: this.done, total, current: t.name });
        },
        update: (p) => {
          const e = easeInOutCubic(p);
          this.nightAmt = 1;
          this.beamAmt = 1;
          this.ufoAlpha = 1;
          if (w && !red) w.x = lerp(startWx, tx, e);
          const targetX = w && !red ? w.x : startWx;
          if (siege) {
            // UFO đứng yên giữa trời, đèn rọi riêng lướt xuống bạn bị chọn.
            this.botW = wideW;
            this.footX = this.cx;
            this.footY = GROUND_Y;
            this.spotX = targetX;
            this.spotY = w ? w.y : GROUND_Y;
            this.spotAmt = e;
            if (!red) {
              this.ux = this.cx;
              this.uy = hy;
              this.tilt = 0;
            }
          } else {
            this.botW = lerp(BEAM_HALF_BOTTOM, 118, e) * (0.9 + this.us * 0.1);
            this.footY = w ? w.y : GROUND_Y;
            if (!red) {
              this.ux = lerp(startUx, targetX, e);
              this.uy = hy;
              this.tilt = (targetX - this.ux) * 0.03;
            }
            this.footX = lerp(startFx, targetX, e);
          }
          this.reactInBeam(w);
        },
      });

      /* bám víu: bám vào cột đèn / biển báo / thân cây, vung chân rồi tuột tay */
      if (!red) {
        segs.push({
          phase: "abducting",
          dur: (siege ? 2.25 : 0.68) * f,
          lastOfPhase: false,
          enter: () => {
            if (!w) return;
            w.el.style.display = "none";
            this.bindGrabProp(this.gripPoint);
            this.makeClone(w);
            this.cb.sfx("grab");
            this.spawnBubble(w, GRAB_LINES[i % GRAB_LINES.length], true);
          },
          update: (p) => {
            this.nightAmt = 1;
            this.beamAmt = 1;
            this.ufoAlpha = 1;
            if (!siege) this.uy = hy;
            else this.spotAmt = 1;
            this.reactInBeam(w);
            if (!w || !this.clone) return;
            const pull = easeInOutCubic(clamp(p * 1.1, 0, 1));
            const slip = Math.exp(-Math.pow((p - 0.62) / 0.07, 2));
            const theta =
              10 + 84 * pull - 24 * slip * pull + Math.sin(this.time * 26) * 3.5 * pull;
            const dir = w.dir;
            const s = w.s;
            const rot = dir * theta;
            const rad = (rot * Math.PI) / 180;
            // Tay phải nắm cột; cả người xoay quanh bàn tay như lá cờ trong gió.
            const px = w.x + dir * GRIP_DX * s;
            const py = w.y - GRIP_Y * s;
            const vx = -dir * GRIP_DX * s;
            const vy = (GRIP_Y - 55) * s;
            const cxw = px + vx * Math.cos(rad) - vy * Math.sin(rad);
            const cyw = py + vx * Math.sin(rad) + vy * Math.cos(rad);
            this.clone.setAttribute(
              "transform",
              `translate(${f1(cxw)} ${f1(cyw)}) scale(${s.toFixed(3)}) rotate(${f1(rot)}) translate(0 55)`,
            );
            this.gripCenter = { x: cxw, y: cyw, rot };
            const kick = Math.sin(this.time * 20) * 38 * (0.35 + pull);
            this.setCloneLimbs(150 + Math.sin(this.time * 18) * 16, -125, kick, -kick);
            if (this.pole) {
              const wob = Math.sin(this.time * 22) * 1.8 * pull * dir;
              this.pole.setAttribute("transform", `${this.poleBaseTransform} rotate(${f1(wob)})`.trim());
            }
          },
        });
      }

      let cloneStart = { x: 0, y: 0, s: 1 };
      let side = 1;
      segs.push({
        phase: "abducting",
        dur: (red ? 0.55 : siege ? 1.65 : 0.9) * (red ? 1 : f),
        lastOfPhase: last,
        enter: () => {
          side = w?.dir ?? 1;
          if (w) {
            cloneStart = { x: w.x, y: w.y, s: w.s };
            if (!red && !this.clone && w.flip) {
              w.el.style.display = "none";
              this.makeClone(w);
            }
          }
          this.cb.sfx("lift");
        },
        update: (p) => {
          this.nightAmt = 1;
          this.beamAmt = 1;
          this.ufoAlpha = 1;
          if (!red) this.uy = hy + Math.sin(p * Math.PI) * 4;
          if (siege) this.spotAmt = 1 - p * 0.7;
          this.reactInBeam(w);
          const u = easeInOutCubic(clamp(p, 0, 1));
          if (red) {
            if (w) w.el.style.opacity = String(Math.max(0, 1 - p * 1.6));
            return;
          }
          if (!this.clone || !w) return;
          const us = this.us;
          const hatchX = this.ux;
          const hatchY = this.uy + UFO_HATCH_Y * us;
          const g = this.gripCenter;
          const p0x = g?.x ?? cloneStart.x;
          const p0y = g?.y ?? cloneStart.y - 55 * cloneStart.s;
          const rot0 = g?.rot ?? 0;
          const p1x = p0x + side * 90 * cloneStart.s + (hatchX - p0x) * 0.15;
          const p1y = p0y - (p0y - hatchY) * 0.62;
          const a = (1 - u) * (1 - u);
          const b = 2 * (1 - u) * u;
          const c = u * u;
          const x = a * p0x + b * p1x + c * hatchX;
          const y = a * p0y + b * p1y + c * hatchY;
          const sc = cloneStart.s * (1 - 0.9 * Math.pow(u, 1.15));
          const rot = rot0 + u * 600 * side;
          this.clone.setAttribute(
            "transform",
            `translate(${f1(x)} ${f1(y)}) scale(${sc.toFixed(3)}) rotate(${f1(rot)}) translate(0 55)`,
          );
          this.clone.setAttribute("opacity", (p > 0.9 ? (1 - p) / 0.1 : 1).toFixed(2));
          const flail = Math.sin(this.time * 16) * 18;
          this.setCloneLimbs(150 + flail, -(150 + flail), (28 + flail) * 0.5, -(28 + flail) * 0.5);
          if (this.pole) {
            // Cột lắc mạnh rồi mờ dần sau khi bạn tuột tay.
            const wob = Math.sin(this.time * 22) * 1.8 * (1 - p) * side;
            this.pole.setAttribute("transform", `${this.poleBaseTransform} rotate(${f1(wob)})`.trim());
            this.pole.setAttribute("opacity", (1 - clamp((p - 0.4) / 0.5, 0, 1)).toFixed(2));
          }
        },
        exit: () => {
          if (this.clone) {
            this.clone.remove();
            this.clone = null;
          }
          this.releaseGrabProp();
          this.gripCenter = null;
          this.gripPoint = null;
          this.spotAmt = 0;
          if (w) {
            w.mode = "gone";
            w.panicX = null;
            w.el.style.display = "none";
            w.el.style.opacity = "";
            w.inBeam = false;
          }
          this.done++;
          this.hudPop = 1;
          this.setHud(null, this.done, total);
          if (!last) this.hudName.textContent = "Chuẩn bị bạn tiếp theo…";
          this.cb.sfx("pop");
          this.cb.onProgress({ done: this.done, total, current: null });
        },
      });
    });

    /* --- revealing --- */
    let leaveFrom = { x: 0, y: 0 };
    const leaveTo = () => {
      switch (this.fx.leave) {
        case "left":
          return { x: this.minX - 360, y: hy - 80 };
        case "right":
          return { x: this.maxX + 360, y: hy - 80 };
        default:
          return { x: this.ux, y: -320 };
      }
    };
    segs.push({
      phase: "revealing",
      dur: (red ? 0.6 : 2.3) * (red ? 1 : f),
      lastOfPhase: true,
      enter: () => {
        leaveFrom = { x: this.ux, y: this.uy };
        this.setHud(null, total, total);
        this.hudPop = 1;
        this.cb.sfx("leave");
      },
      update: (p) => {
        const dest = leaveTo();
        this.beamAmt = 1 - easeInCubic(clamp(p / 0.3, 0, 1));
        this.nightAmt = 1 - easeInOutCubic(clamp((p - 0.1) / 0.8, 0, 1));
        this.speedMul = lerp(1.5, 1, p);
        if (red) {
          this.ufoAlpha = 1 - p;
        } else {
          const q = easeInCubic(clamp((p - 0.28) / 0.72, 0, 1));
          this.ux = lerp(leaveFrom.x, dest.x, q);
          this.uy = lerp(leaveFrom.y, dest.y, q);
          this.tilt = q * (dest.x > leaveFrom.x ? 14 : dest.x < leaveFrom.x ? -14 : 0);
          this.hudShow = 1 - clamp((p - 0.6) / 0.3, 0, 1);
        }
        if (p > 0.82) this.respawnGone();
      },
    });

    return segs;
  }

  /**
   * Nhân vật nằm trong chùm sáng sẽ nhảy lên, vẫy tay và có thể nói câu vui.
   * `exclude` là học sinh đang được hút (do đoạn hoạt cảnh riêng điều khiển).
   */
  private reactInBeam(exclude?: Walker) {
    const topY = this.uy + UFO_HATCH_Y * this.us;
    const botY = this.footY;
    let activeBubbles = this.bubbles.filter((b) => b.walker).length;
    for (const w of this.walkers.values()) {
      if (w.mode === "gone" || w === exclude) continue;
      const t = clamp((w.y - topY) / Math.max(1, botY - topY), 0, 1);
      const center = lerp(this.ux, this.footX, t);
      const half = lerp(BEAM_HALF_TOP * this.us, this.botW * this.beamAmt, t) * 0.95;
      const inside = Math.abs(w.x - center) < half && this.beamAmt > 0.5;
      if (inside && !w.inBeam) {
        const point = this.nearestGrabPoint(w);
        if (point) {
          const side = point.x < w.x ? -1 : 1;
          const personalOffset = ((hashString(w.id) % 3) - 1) * 8;
          w.panicX = clamp(
            point.x - side * (GRIP_DX + personalOffset) * w.s,
            this.minX + 40,
            this.maxX - 40,
          );
        }
        if (activeBubbles < 4 && Math.random() < 0.6) {
          this.spawnBubble(w);
          activeBubbles++;
        }
      }
      w.inBeam = inside;
      w.mode = inside ? "react" : "walk";
      if (!inside) w.panicX = null;
    }
  }

  private makeClone(w: Walker) {
    if (!w.flip) return;
    const clone = w.flip.cloneNode(true) as SVGGElement;
    clone.removeAttribute("data-role");
    // bản sao nằm trên lớp sáng nên không bị tối
    clone.setAttribute("opacity", "1");
    if (w.dir < 0) clone.setAttribute("transform", "scale(-1 1)");
    const wrapper = document.createElementNS("http://www.w3.org/2000/svg", "g");
    wrapper.appendChild(clone);
    wrapper.setAttribute("transform", `translate(${f1(w.x)} ${f1(w.y - 55 * w.s)})`);
    this.abductLayer.appendChild(wrapper);
    this.clone = wrapper;
  }

  private setCloneLimbs(armL: number, armR: number, legL: number, legR: number) {
    if (!this.clone) return;
    const set = (role: string, a: number) =>
      this.clone?.querySelectorAll(`[data-role="${role}"]`).forEach((el) =>
        el.setAttribute("transform", `rotate(${f1(a)})`),
      );
    set("armL", armL);
    set("armR", armR);
    set("legL", legL);
    set("legR", legR);
  }

  /** Chọn đạo cụ gần học sinh nhất, ưu tiên cùng lớp chiều sâu (trục y). */
  private nearestGrabPoint(w: Walker): GrabPoint | null {
    let nearest: GrabPoint | null = null;
    let best = Number.POSITIVE_INFINITY;
    for (const point of this.grabPoints) {
      if (point.x < this.minX - 60 || point.x > this.maxX + 60) continue;
      const score = Math.abs(point.x - w.x) + Math.abs(point.y - w.y) * 2.4;
      if (score < best) {
        best = score;
        nearest = point;
      }
    }
    return nearest;
  }

  /** Giữ tham chiếu tới chính đạo cụ đang hiển thị để rung nó khi học sinh bám. */
  private bindGrabProp(point: GrabPoint | null) {
    this.releaseGrabProp();
    if (!point) return;
    const anchor = Array.from(this.svg.querySelectorAll<SVGGElement>("[data-grab-id]"))
      .find((el) => el.getAttribute("data-grab-id") === point.id);
    const visual = anchor?.querySelector<SVGGElement>("[data-grab-visual]") ?? null;
    if (!visual) return;
    this.pole = visual;
    this.poleBaseTransform = visual.getAttribute("transform") ?? "";
    visual.removeAttribute("opacity");
  }

  private releaseGrabProp() {
    if (!this.pole) return;
    if (this.poleBaseTransform) this.pole.setAttribute("transform", this.poleBaseTransform);
    else this.pole.removeAttribute("transform");
    this.pole.removeAttribute("opacity");
    this.pole = null;
    this.poleBaseTransform = "";
  }

  /** Cho các nhân vật vừa được hút quay lại đi dạo từ mép màn hình. */
  private respawnGone() {
    for (const w of this.walkers.values()) {
      if (w.mode !== "gone") continue;
      w.mode = "walk";
      w.panicX = null;
      w.el.style.display = "";
      w.el.style.opacity = "";
      w.x = w.dir > 0 ? this.minX - 90 : this.maxX + 90;
      w.up = 0;
      this.writeWalker(w);
    }
  }

  /** Dừng ngay hoạt cảnh (bỏ qua / hủy) và trả scene về trạng thái nghỉ. Kết quả không bị ảnh hưởng. */
  finishNow() {
    this.running = false;
    this.opts = null;
    this.segs = [];
    this.segIdx = -1;
    this.cleanup();
    this.cb.sfx("leave"); // dừng tiếng động cơ UFO nếu đang kêu
  }

  private cleanup() {
    if (this.clone) {
      this.clone.remove();
      this.clone = null;
    }
    this.releaseGrabProp();
    this.abductLayer.replaceChildren();
    this.gripPoint = null;
    this.gripCenter = null;
    this.spotAmt = 0;
    for (const b of this.bubbles) b.walker = null;
    for (const w of this.walkers.values()) {
      w.mode = "walk";
      w.inBeam = false;
      w.panicX = null;
      w.up = 0;
      w.el.style.display = "";
      w.el.style.opacity = "";
    }
    this.ufoAlpha = 0;
    this.beamAmt = 0;
    this.nightAmt = 0;
    this.hudShow = 0;
    this.speedMul = 1;
    this.tilt = 0;
    this.uy = -400;
    this.appliedNight = -1;
    this.writeAllWalkers();
    this.renderFx();
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.abductLayer.replaceChildren();
  }
}
