import { Particles, Lights, P, Rng, fit, sparkle, clamp, smooth, ease, TAU, READY } from "../../core/index.js";

export const meta = {
  name: "Sword flight",
  desc: "A flying sword launches from behind the shoulder, trails a ribbon of sword-light, strikes, and returns in a falling arc.",
  tags: ["xianxia", "sword", "projectile", "directional", "one-shot", "combat"],
  size: [200, 120],
  origin: [36, 100],
  duration: 1.28,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: {
    palette: ["#101820", "#204060", "#3a88c0", "#80d8f0", "#e0f8ff", "#ffffff"],
    seed: 6,
  },
};

const POINT = { ...READY, weapon: "sword", fx: 10, fy: -26, sa: -1.4, bx: -4, by: -18 };
const CAST = { ...POINT, crouch: 2, lean: 2, fx: 16, fy: -30, sa: -1.8, ghost: 1 };
const REEL = { ...READY, weapon: "sword", fx: 12, fy: -20, sa: -0.6, crouch: 1 };

export const act = {
  target: { x: 96 },
  poses: [
    [-0.4, { ...POINT, fx: 8, fy: -22 }],
    [-0.12, POINT],
    [0.0, CAST, "out"],
    [0.28, { ...CAST, fx: 18, fy: -26 }],
    [0.7, REEL],
    [1.0, READY],
  ],
  hits: [{ t: 0.28, stop: 0.12, shake: 0.16, amp: 2, push: 2.6, straw: 14 }],
};

function swordPos(t) {
  // outbound 0-0.28, hit, return 0.32-0.85
  if (t < 0) return [8, -28, -0.8];
  if (t < 0.28) {
    const u = ease.outQuart(t / 0.28);
    return [8 + 96 * u, -28 - 18 * Math.sin(u * Math.PI), -0.4 + u];
  }
  const u = clamp((t - 0.28) / 0.55, 0, 1);
  const e = ease.inOutQuad ? ease.inOutQuad(u) : u * u * (3 - 2 * u);
  const x = 104 * (1 - e) + 10 * e;
  const y = -22 + Math.sin(e * Math.PI) * -10 + e * 4;
  const a = 0.6 + e * 2.4;
  return [x, y, a];
}

export function create(o) {
  const C = fit(o.palette, 6), R = new Rng(o.seed);
  const ps = new Particles({ rng: R, ground: () => 0, sparks: [C[5], C[4], C[3]] });
  const lights = new Lights();
  let t = 0, hit = false, last = [8, -28];
  return {
    update(dt) {
      t += dt;
      ps.update(dt);
      lights.update(dt);
      const [x, y] = swordPos(t);
      if (t > 0 && t < 0.9) {
        const vx = (x - last[0]) / Math.max(dt, 0.008), vy = (y - last[1]) / Math.max(dt, 0.008);
        if (R.chance(0.7)) ps.spawn(P.MOTE, x, y, -vx * 0.05, -vy * 0.05 - 8, 0.35, C[3], 1);
        last = [x, y];
      }
      if (!hit && t >= 0.28) {
        hit = true;
        lights.add(104, -22, 40, C[5], 0.8, 0.25);
        for (let i = 0; i < 22; i++) {
          const a = R.range(0, TAU);
          ps.spawn(P.SPARK, 104, -22, Math.cos(a) * R.range(60, 200), Math.sin(a) * R.range(40, 160), R.range(0.15, 0.4), C[4]);
        }
      }
    },
    drawBack(p) {
      const fade = 1 - smooth(0.3, 0.55, t);
      if (t > 0.2 && t < 0.55) p.disc(104, 2, 10, C[1], 0.25 * fade);
    },
    draw(p) {
      if (t >= 0 && t < 1.0) {
        const [x, y, a] = swordPos(t);
        const ca = Math.cos(a), sa = Math.sin(a);
        const L = 14, W = 1.4;
        // blade
        p.beam(x - ca * 4, y - sa * 4, x + ca * L, y + sa * L, W + 0.5, (u) => (u < 0.15 ? C[1] : u > 0.8 ? C[5] : C[4]), 1);
        p.px(x - ca * 5, y - sa * 5, C[3]); // guard
        p.glow(x, y, 10, C[4], 0.45);
        // trail
        if (t < 0.5) {
          const [x0, y0] = swordPos(Math.max(0, t - 0.08));
          p.glowLine(x0, y0, x, y, 8, C[3], 0.4 * (1 - t / 0.5));
        }
        if (t > 0.26 && t < 0.4) sparkle(p, 104, -22, 9, C[5], C[3], 0.9);
      }
      ps.draw(p);
      lights.draw(p);
    },
  };
}
