import { Particles, Lights, P, PF, Rng, fit, sparkle, band, clamp, smooth, ease, TAU, READY } from "../../core/index.js";

export const meta = {
  name: "Protecting true qi",
  desc: "Jade-gold qi blooms from the dantian, hexagonal talisman plates lock into a breathing dome, then fade with lingering motes.",
  tags: ["xianxia", "shield", "holy", "buff", "one-shot", "combat"],
  size: [128, 120],
  origin: [64, 104],
  duration: 1.4,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: {
    palette: ["#14281c", "#2a5840", "#58a070", "#b8e0a8", "#f0ffe0", "#ffffff"],
    seed: 2,
  },
};

const OPEN = { ...READY, fx: -10, fy: -28, bx: 10, by: -28, turn: 1, crouch: 1 };
const HOLD = { ...READY, fx: -8, fy: -22, bx: 8, by: -22, turn: 1 };

export const act = {
  target: false,
  poses: [
    [-0.36, READY],
    [-0.1, { ...OPEN, crouch: 3 }],
    [0.0, OPEN, "out"],
    [0.4, HOLD],
    [1.1, READY],
  ],
  hits: [{ t: 0.08, stop: 0.08, shake: 0.1, amp: 1, target: false }],
};

export function create(o) {
  const C = fit(o.palette, 6), R = new Rng(o.seed);
  const ps = new Particles({ rng: R, ground: () => 0, sparks: [C[5], C[4], C[3]] });
  const lights = new Lights();
  lights.add(0, -18, 40, C[3], 0.5, 0.5);
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * TAU;
    ps.spawn(P.STREAK, Math.cos(a) * 28, Math.sin(a) * 12 - 16, -Math.cos(a) * 50, -Math.sin(a) * 30, 0.28, C[3], 1, R.range(0, 0.1));
  }
  for (let i = 0; i < 16; i++) {
    const a = R.range(0, TAU);
    ps.spawn(P.STAR, Math.cos(a) * R.range(8, 22), Math.sin(a) * 8 - 18, 0, R.range(-16, -4), R.range(0.5, 1.0), C[4], 1, R.range(0.1, 0.4));
  }
  let t = 0;
  return {
    update(dt) { t += dt; ps.update(dt); lights.update(dt); },
    drawBack(p) {
      const u = ease.outQuart(clamp(t / 0.22, 0, 1));
      const fade = 1 - smooth(0.7, 1.35, t);
      if (fade <= 0) return;
      band(p, 0, 0, 26 * u, 0.22, 2, 0.55 * fade, C, (g) => Math.sin(g) < 0, false);
      // far hex plates
      plates(p, C, u, fade, true);
    },
    draw(p) {
      const u = ease.outQuart(clamp(t / 0.22, 0, 1));
      const fade = 1 - smooth(0.7, 1.35, t);
      if (t < 0.1) sparkle(p, 0, -16, 10, C[5], C[3], 0.8);
      if (fade > 0) {
        band(p, 0, 0, 26 * u, 0.22, 2, 0.7 * fade, C, (g) => Math.sin(g) >= 0, false);
        plates(p, C, u, fade, false);
        const pulse = 0.7 + 0.3 * Math.sin(t * 10);
        p.glow(0, -16, 36, C[3], 0.28 * fade * pulse);
        p.ring(0, -20, 14 * u, 1, C[4], 0.6 * fade);
        p.ring(0, -20, 18 * u, 1, C[2], 0.35 * fade);
      }
      ps.draw(p);
      lights.draw(p);
    },
  };
}

function plates(p, C, u, fade, back) {
  const n = 6;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU - Math.PI / 2;
    const isBack = Math.sin(a) < 0;
    if (back !== isBack) continue;
    const r = 20 * u;
    const x = Math.cos(a) * r, y = Math.sin(a) * r * 0.42 - 16;
    const s = 4 * u;
    p.poly([
      [x, y - s], [x + s * 0.86, y - s * 0.5], [x + s * 0.86, y + s * 0.5],
      [x, y + s], [x - s * 0.86, y + s * 0.5], [x - s * 0.86, y - s * 0.5],
    ], C[isBack ? 2 : 4], 0.75 * fade);
    p.px(x, y, C[5]);
  }
}
