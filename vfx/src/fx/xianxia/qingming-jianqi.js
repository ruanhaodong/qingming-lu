import { Particles, Lights, P, PF, Rng, fit, sparkle, ease, clamp, smooth, TAU, READY } from "../../core/index.js";

export const meta = {
  name: "Qingming sword qi",
  desc: "Jade-cyan sword light gathers on the blade, then a long crescent of qi tears forward, leaving rune afterimages and falling motes.",
  tags: ["xianxia", "sword", "qi", "directional", "one-shot", "combat"],
  size: [176, 112],
  origin: [48, 96],
  duration: 0.95,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: {
    palette: ["#0a2018", "#12382c", "#1e6a4e", "#3cb88a", "#8cf0c8", "#d8fff0", "#ffffff"],
    seed: 3,
  },
};

const GUARD = { ...READY, weapon: "sword", fx: 12, fy: -21, sa: -0.85 };
const WIND = { ...GUARD, x: -8, crouch: 4, lean: -4, fx: -8, fy: -34, sa: -2.6, bx: 9, by: -24, armsFront: true, ffx: 9, fbx: -8 };
const CUT = { ...GUARD, x: 2, crouch: 2, lean: 4, fx: 22, fy: -28, sa: -0.2, bx: -8, by: -22, ffx: 12, fbx: -10, ghost: 1 };
const RECOVER = { ...GUARD, x: 1, crouch: 3, fx: 16, fy: -20, sa: 0.3 };

export const act = {
  target: { x: 72 },
  poses: [
    [-0.5, { ...GUARD, x: -6 }],
    [-0.22, WIND],
    [0.0, CUT, "snap"],
    [0.12, { ...CUT, x: 6, lean: 5, fx: 22, fy: -22, sa: 0.45 }],
    [0.4, RECOVER],
    [0.8, GUARD],
  ],
  hits: [{ t: 0.08, stop: 0.12, shake: 0.16, amp: 2, push: 2.4, straw: 14 }],
  dust: [{ t: 0.08, x: 18, n: 6, dir: 1 }],
};

export function create(o) {
  const C = fit(o.palette, 7), R = new Rng(o.seed);
  const ps = new Particles({ rng: R, ground: () => 0, sparks: [C[6], C[5], C[4], C[3]] });
  const lights = new Lights();
  // charge motes
  for (let i = 0; i < 18; i++) {
    const a = R.range(-2.4, -0.4), rad = R.range(16, 34);
    ps.spawn(P.STREAK, Math.cos(a) * rad + 6, Math.sin(a) * rad - 22, -Math.cos(a) * 40, -Math.sin(a) * 40, R.range(0.18, 0.32), C[4], 1, R.range(0, 0.12));
  }
  lights.add(12, -22, 28, C[5], 0.45, 0.35);
  let t = 0, burst = false;
  return {
    update(dt) {
      t += dt;
      ps.update(dt);
      lights.update(dt);
      if (!burst && t >= 0.02) {
        burst = true;
        lights.add(28, -24, 50, C[6], 0.9, 0.22);
        for (let i = 0; i < 36; i++) {
          const a = R.range(-0.55, 0.55);
          const sp = R.range(180, 380);
          ps.spawn(P.SPARK, 16, -22, Math.cos(a) * sp, Math.sin(a) * sp * 0.45 - 20, R.range(0.2, 0.5), C[5], 1);
        }
        for (let i = 0; i < 10; i++) {
          ps.spawn(P.MOTE, 20, -20, R.range(20, 80), R.range(-40, 10), R.range(0.4, 0.8), C[3], 1, 0, PF.BACK);
        }
      }
    },
    drawBack(p) {
      if (t < 0.55) {
        const u = ease.outQuart(clamp(t / 0.18, 0, 1));
        const fade = 1 - smooth(0.25, 0.55, t);
        p.disc(10 + u * 30, 2, 10, C[1], 0.25 * fade);
      }
    },
    draw(p) {
      const u = ease.outExpo(clamp(t / 0.16, 0, 1));
      const fade = 1 - smooth(0.2, 0.7, t);
      if (t < 0.7 && fade > 0.02) {
        const x0 = 14, y0 = -22, x1 = 14 + 90 * u, y1 = -22 - 6 * u;
        const w = 7 * fade * (1 - u * 0.3);
        p.beam(x0, y0, x1, y1, w, (s) => (s < 0.1 || s > 0.85 ? C[6] : s < 0.35 ? C[5] : C[3]), fade);
        p.glowLine(x0, y0, x1, y1, 12, C[4], 0.4 * fade);
        // afterimage runes
        for (let k = 0; k < 4; k++) {
          const s = u * 0.7 + k * 0.08;
          if (s > u) continue;
          const rx = 14 + 90 * s, ry = -26 - k * 2;
          p.px(rx, ry, C[5]);
          p.px(rx + 1, ry - 1, C[6]);
          p.px(rx, ry + 2, C[3]);
        }
        if (t < 0.12) sparkle(p, x1, y1, 8, C[6], C[4], 0.8);
      }
      ps.draw(p);
      lights.draw(p);
      if (t < 0.28) p.glow(16, -22, 36, C[5], 0.5 * (1 - t / 0.28));
    },
  };
}
