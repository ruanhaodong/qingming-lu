import { Particles, Lights, P, Rng, fit, sparkle, flare, clamp, smooth, bolt, READY } from "../../core/index.js";

export const meta = {
  name: "Palm thunder",
  desc: "Beads of thunder gather in the palm, then a white-hot hand-print of lightning forks into the target with ozone sparks.",
  tags: ["xianxia", "lightning", "thunder", "directional", "one-shot", "combat"],
  size: [144, 112],
  origin: [44, 96],
  duration: 1.05,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: {
    palette: ["#14183a", "#2a3a88", "#4a6cff", "#8cb0ff", "#d0e0ff", "#ffffff"],
    seed: 5,
  },
};

const READYH = { ...READY, fx: 8, fy: -18 };
const CHARGE = { ...READYH, x: 2, crouch: 3, lean: -2, fx: 12, fy: -22, bx: -4, by: -16, turn: 1 };
const SLAM = { ...READYH, x: 4, crouch: 5, lean: 6, fx: 22, fy: -20, bx: -8, by: -16, ghost: 1 };

export const act = {
  target: { x: 58 },
  poses: [
    [-0.42, READYH],
    [-0.18, CHARGE],
    [0.0, SLAM, "snap"],
    [0.22, { ...SLAM, crouch: 6, fx: 20, fy: -18 }],
    [0.7, READYH],
  ],
  hits: [{ t: 0.06, stop: 0.14, shake: 0.2, amp: 3, push: 2.2, straw: 16, skin: "shock" }],
  dust: [{ t: 0.06, x: 16, n: 5, dir: 1 }],
};

export function create(o) {
  const C = fit(o.palette, 6), R = new Rng(o.seed);
  const ps = new Particles({ rng: R, ground: () => 0, sparks: [C[5], C[4], C[3], C[2]] });
  const lights = new Lights();
  const path1 = bolt(R, 22, -20, 64, -16, { jag: 0.28, depth: 5 });
  const path2 = bolt(R, 22, -20, 58, -30, { jag: 0.32, depth: 4 });
  const path3 = bolt(R, 40, -18, 72, -8, { jag: 0.35, depth: 4 });
  let t = 0, popped = false;
  return {
    update(dt) {
      t += dt;
      ps.update(dt);
      lights.update(dt);
      if (!popped && t >= 0) {
        popped = true;
        lights.add(22, -20, 48, C[5], 1, 0.28);
        lights.add(48, -18, 30, C[4], 0.6, 0.3);
        for (let i = 0; i < 40; i++) {
          const a = R.range(-1.1, 1.1);
          ps.spawn(P.SPARK, 20, -20, Math.cos(a) * R.range(120, 320), Math.sin(a) * R.range(40, 160) - 40, R.range(0.18, 0.45), C[4]);
        }
        for (let i = 0; i < 8; i++) ps.spawn(P.MOTE, 22, -18, R.range(-20, 80), R.range(-60, 10), 0.5, C[2]);
      }
    },
    drawBack(p) {
      const fade = 1 - smooth(0.15, 0.7, t);
      if (t > 0 && fade > 0) p.disc(40, 2, 14, C[1], 0.2 * fade);
    },
    draw(p) {
      if (t < 0.05) {
        p.glow(14, -22, 18, C[4], 0.55);
        p.circle(14, -22, 3, C[5]);
      }
      const fade = 1 - smooth(0.08, 0.55, t);
      if (t >= 0 && fade > 0.02) {
        if (t < 0.1) {
          flare(p, 22, -20, 16, 0.9, C);
          sparkle(p, 22, -20, 10, C[5], C[3], 1);
        }
        p.polyline(path1, (u) => (u < 0.08 ? C[5] : C[3]), fade);
        p.glowLine(22, -20, 64, -16, 10, C[4], 0.45 * fade);
        p.polyline(path2, C[4], fade * 0.8);
        p.polyline(path3, C[3], fade * 0.6);
        p.circle(22, -20, 3 + (1 - fade) * 2, C[5], fade);
      }
      ps.draw(p);
      lights.draw(p);
    },
  };
}
