import { Particles, Lights, Bits, P, PF, B, Rng, fit, flare, sparkle, clamp, smooth, ease, TAU, READY } from "../../core/index.js";

export const meta = {
  name: "Cinnabar soul-fire",
  desc: "Cinnabar furnace fire erupts from the chest, alchemical seals spin, and a wave of dark-red soul-flame rushes forward.",
  tags: ["xianxia", "fire", "alchemy", "directional", "one-shot", "combat"],
  size: [160, 136],
  origin: [40, 116],
  duration: 2.05,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: {
    palette: ["#2a0808", "#6a140c", "#b42810", "#e86818", "#f0c040", "#fff4c8"],
    seed: 4,
  },
};

const GUARD = { ...READY, fx: 10, fy: -18 };
const GATHER = { ...GUARD, crouch: 4, lean: -3, fx: 6, fy: -16, bx: -4, by: -16 };
const RELEASE = { ...GUARD, x: 3, crouch: 2, lean: 5, fx: 20, fy: -24, bx: -8, by: -18, ghost: 1 };

export const act = {
  target: { x: 70 },
  poses: [
    [-0.48, GUARD],
    [-0.2, GATHER],
    [0.0, RELEASE, "snap"],
    [0.2, { ...RELEASE, fx: 24, fy: -20, lean: 6 }],
    [0.85, GUARD],
  ],
  hits: [{ t: 0.14, stop: 0.12, shake: 0.18, amp: 2, push: 2.0, straw: 12, skin: "red" }],
  dust: [{ t: 0.14, x: 20, n: 6, dir: 1 }],
};

export function create(o) {
  const C = fit(o.palette, 6), R = new Rng(o.seed);
  const ps = new Particles({ rng: R, ground: () => 0, sparks: [C[5], C[4], C[3], C[2]], onLand: () => {} });
  const lights = new Lights();
  const bits = new Bits({ ground: () => 0 });
  let t = 0, wave = false;
  lights.add(0, -16, 24, C[3], 0.4, 0.4);
  for (let i = 0; i < 20; i++) {
    ps.spawn(P.EMBER, R.range(-8, 8), -10, R.range(-10, 10), R.range(-80, -30), R.range(0.3, 0.6), 0, 1, R.range(0, 0.15), PF.SMOKES);
  }
  return {
    update(dt) {
      t += dt; ps.update(dt); lights.update(dt); bits.update(dt);
      if (!wave && t >= 0.04) {
        wave = true;
        lights.add(20, -18, 56, C[4], 0.85, 0.35);
        for (let i = 0; i < 28; i++) {
          ps.spawn(P.FIRE, 8, -16, R.range(80, 240), R.range(-80, 20), R.range(0.35, 0.7), 0, 1, 0, PF.SMOKES);
        }
        for (let i = 0; i < 20; i++) {
          ps.spawn(P.SPARK, 10, -16, R.range(60, 280), R.range(-100, 40), R.range(0.2, 0.5), C[4]);
        }
        for (let i = 0; i < 6; i++) {
          bits.add({ kind: B.SHARD, x: 8, y: -14, vx: R.range(40, 140), vy: R.range(-80, -10), a: R.range(0, TAU), va: R.range(-6, 6), s: R.range(1.2, 2.4), c: C[3], ramp: C, life: R.range(0.4, 0.8) });
        }
      }
    },
    drawBack(p) {
      const fade = 1 - smooth(0.3, 1.1, t);
      if (fade > 0) p.disc(30, 2, 16, C[1], 0.28 * fade);
    },
    draw(p) {
      if (t < 0.12) {
        flare(p, 4, -18, 12, 0.7, C);
        // spinning seal
        const a0 = t * 18;
        for (let i = 0; i < 4; i++) {
          const a = a0 + i * TAU / 4;
          p.px(Math.cos(a) * 8, Math.sin(a) * 6 - 16, C[5]);
        }
        p.ring(0, -16, 9, 1, C[4], 0.8);
      }
      const u = ease.outQuart(clamp((t - 0.04) / 0.25, 0, 1));
      const fade = 1 - smooth(0.25, 0.9, t);
      if (t > 0.04 && fade > 0) {
        const x1 = 8 + 86 * u, y1 = -16 - 4 * u;
        p.beam(8, -16, x1, y1, 9 * fade, (s) => (s < 0.15 ? C[5] : s < 0.4 ? C[4] : C[2]), fade * 0.9);
        p.glowLine(8, -16, x1, y1, 16, C[3], 0.4 * fade);
        if (t < 0.2) sparkle(p, x1, y1, 8, C[5], C[3], 0.8);
      }
      bits.draw(p);
      ps.draw(p);
      lights.draw(p);
    },
  };
}
