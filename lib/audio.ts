import type { SfxKind } from "./scene-engine";

/**
 * Âm thanh tạo bằng Web Audio, không cần file asset.
 * AudioContext chỉ được tạo sau một thao tác của người dùng (unlock).
 */

type Ctx = AudioContext;

const NOTE = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

// Giai điệu nền nhẹ: gam ngũ cung C trưởng, tiến trình C – Am – F – G.
const CHORDS = [
  { root: 48, arp: [60, 64, 67, 72, 67, 64] },
  { root: 45, arp: [57, 60, 64, 69, 64, 60] },
  { root: 41, arp: [60, 65, 69, 72, 69, 65] },
  { root: 43, arp: [59, 62, 67, 71, 67, 62] },
];

export class SoundManager {
  private ctx: Ctx | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private enabled = true;
  private musicWanted = false;
  private musicTimer: number | null = null;
  private nextNoteTime = 0;
  private step = 0;
  private hum: { stop: () => void } | null = null;

  /** Phải gọi từ trong một sự kiện của người dùng (click / phím). */
  unlock() {
    if (typeof window === "undefined") return;
    try {
      if (!this.ctx) {
        const AC =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.enabled ? 0.9 : 0;
        this.master.connect(this.ctx.destination);
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.5;
        this.musicGain.connect(this.master);
      }
      if (this.ctx.state === "suspended") void this.ctx.resume();
      this.syncMusic();
    } catch {
      /* âm thanh là tính năng phụ: bỏ qua lỗi */
    }
  }

  get unlocked() {
    return this.ctx !== null;
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (this.master && this.ctx) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.setTargetAtTime(on ? 0.9 : 0, this.ctx.currentTime, 0.05);
    }
    if (!on) this.stopHum();
    this.syncMusic();
  }

  /** Nhạc nền chỉ phát khi bật âm thanh, đã unlock và đang ở trạng thái nghỉ. */
  setMusic(wanted: boolean) {
    this.musicWanted = wanted;
    this.syncMusic();
  }

  private syncMusic() {
    const should = this.enabled && this.musicWanted && this.ctx !== null;
    if (should && this.musicTimer === null && this.ctx) {
      this.nextNoteTime = this.ctx.currentTime + 0.1;
      this.step = 0;
      this.musicGain?.gain.setTargetAtTime(0.5, this.ctx.currentTime, 0.4);
      this.musicTimer = window.setInterval(() => this.scheduleMusic(), 120);
    } else if (!should && this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private scheduleMusic() {
    const ctx = this.ctx;
    if (!ctx || !this.musicGain) return;
    const eighth = 60 / 92 / 2;
    while (this.nextNoteTime < ctx.currentTime + 0.4) {
      const bar = Math.floor(this.step / 12) % CHORDS.length;
      const inBar = this.step % 12;
      const chord = CHORDS[bar];
      if (inBar === 0) this.pad(NOTE(chord.root), this.nextNoteTime, eighth * 12);
      if (inBar % 2 === 0) {
        const n = chord.arp[(inBar / 2) % chord.arp.length];
        this.tone(NOTE(n), this.nextNoteTime, eighth * 1.6, "triangle", 0.09, this.musicGain);
      }
      this.nextNoteTime += eighth;
      this.step++;
    }
  }

  private pad(freq: number, t: number, dur: number) {
    const ctx = this.ctx;
    if (!ctx || !this.musicGain) return;
    for (const mult of [1, 1.5]) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = freq * mult;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.08, t + 0.6);
      g.gain.linearRampToValueAtTime(0, t + dur);
      o.connect(g).connect(this.musicGain);
      o.start(t);
      o.stop(t + dur + 0.05);
    }
  }

  private tone(
    freq: number,
    t: number,
    dur: number,
    type: OscillatorType,
    vol: number,
    dest: AudioNode,
    freqEnd?: number,
  ) {
    const ctx = this.ctx;
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.03, dur / 4));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private noise(t: number, dur: number, f0: number, f1: number, vol: number) {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 2;
    filter.frequency.setValueAtTime(f0, t);
    filter.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(g).connect(this.master);
    src.start(t);
  }

  private startHum() {
    const ctx = this.ctx;
    if (!ctx || !this.master || this.hum) return;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 1);
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 5.5;
    lfoGain.gain.value = 0.02;
    lfo.connect(lfoGain).connect(g.gain);
    const oscs = [78, 117.5].map((f) => {
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = f;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 420;
      o.connect(lp).connect(g);
      o.start();
      return o;
    });
    lfo.start();
    g.connect(this.master);
    this.hum = {
      stop: () => {
        const t = ctx.currentTime;
        g.gain.cancelScheduledValues(t);
        g.gain.setTargetAtTime(0, t, 0.25);
        window.setTimeout(() => {
          oscs.forEach((o) => o.stop());
          lfo.stop();
          g.disconnect();
        }, 1200);
      },
    };
  }

  private stopHum() {
    this.hum?.stop();
    this.hum = null;
  }

  play(kind: SfxKind) {
    const ctx = this.ctx;
    if (!ctx || !this.master || !this.enabled) return;
    try {
      if (ctx.state === "suspended") void ctx.resume();
      const t = ctx.currentTime + 0.01;
      const m = this.master;
      switch (kind) {
        case "arrive":
          this.startHum();
          this.noise(t, 1.6, 300, 1800, 0.22);
          this.tone(180, t, 1.6, "sine", 0.08, m, 520);
          break;
        case "beamOn":
          this.noise(t, 0.7, 600, 4200, 0.2);
          this.tone(320, t, 0.7, "triangle", 0.09, m, 980);
          break;
        case "grab":
          this.tone(310, t, 0.5, "square", 0.04, m, 190);
          this.tone(520, t + 0.12, 0.45, "sawtooth", 0.035, m, 250);
          break;
        case "lift":
          this.tone(260, t, 1.5, "sine", 0.1, m, 1300);
          this.tone(390, t + 0.05, 1.4, "triangle", 0.05, m, 1900);
          break;
        case "pop":
          this.tone(NOTE(88), t, 0.35, "sine", 0.18, m);
          this.tone(NOTE(93), t + 0.09, 0.5, "sine", 0.16, m);
          break;
        case "leave":
          this.noise(t, 1.4, 2400, 260, 0.2);
          this.tone(520, t, 1.4, "sine", 0.07, m, 140);
          this.stopHum();
          break;
        case "done":
          this.stopHum();
          [72, 76, 79, 84].forEach((n, i) =>
            this.tone(NOTE(n), t + 0.9 + i * 0.12, 0.7, "triangle", 0.14, m),
          );
          break;
      }
    } catch {
      /* bỏ qua */
    }
  }

  /** Tiếng "bing" khi bật âm thanh để người dùng biết nó đã hoạt động. */
  chime() {
    if (!this.ctx || !this.master || !this.enabled) return;
    const t = this.ctx.currentTime + 0.01;
    this.tone(NOTE(84), t, 0.3, "sine", 0.12, this.master);
  }

  dispose() {
    if (this.musicTimer !== null) window.clearInterval(this.musicTimer);
    this.musicTimer = null;
    this.stopHum();
    void this.ctx?.close();
    this.ctx = null;
  }
}
