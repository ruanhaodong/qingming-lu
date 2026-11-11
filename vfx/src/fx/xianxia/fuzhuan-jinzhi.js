import { Particles, Lights, P, Rng, fit, sparkle, clamp, smooth, ease, TAU, READY } from "../../core/index.js";

export const meta = {
  name: "Talisman bind",
  desc: "Yellow talisman papers fly out, stick to the target in a formation, then golden seal characters slam down and bind with chains of script.",
  tags: ["xianxia", "talisman", "arcane", "bind", "directional", "one-shot", "combat"],
  size: [160, 128],
  origin: [36, 112],
  duration: 1.35,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: {
    palette: ["#3a2010", "#8a4a18", "#d4a030", "#f0e080", "#fff8d0", "#ffffff"],
    seed: 7,
  },
};

const CAST = { ...READY, fx: 14, fy: -22, bx: -6, by: -16, lean: 2, crouch: 2 };
const SLAM = { ...READY, x: 3, fx: 14, fy: -26, bx: 8, by: -24, turn: 1, crouch: 3 };

export const act = {
  target: { x: 70 },
  poses: [
    [-0.4, { ...READY, fx: 8, fy: -18 }],
    [-0.16, CAST],
    [0.0, { ...CAST, fx: 18, fy: -24 }, "out"],
    [0.28, SLAM, "snap"],
    [0.9, READY],
  ],
  hits: [{ t: 0.3, stop: 0.14, shake: 0.14, amp: 2, push: -1.2, straw: 10, skin: "holy" }],
};

export function create(o) {
  const C = fit(o.palette, 6), R = new Rng(o.seed);
  const ps = new Particles({ rng: R, ground: () => 0, sparks: [C[5], C[4], C[3]] });
  const lights = new Lights();
  const papers = [];
  for (let i = 0; i < 5; i++) {
    papers.push({
      delay: i * 0.05,
      a: (i / 5) * TAU,
      rot: R.range(-0.4, 0.4),
      vr: R.range(-3, 3),
    });
  }
  let t = 0, slammed = false;
  return {
    update(dt) {
      t += dt; ps.update(dt); lights.update(dt);
      if (!slammed && t >= 0.28) {
        slammed = true;
        lights.add(70, -20, 46, C[4], 0.75, 0.3);
        for (let i = 0; i < 20; i++) {
          const a = R.range(0, TAU);
          ps.spawn(P.SPARK, 70, -20, Math.cos(a) * R.range(40, 160), Math.sin(a) * R.range(20, 100) - 20, R.range(0.2, 0.45), C[4]);
        }
        for (let i = 0; i < 8; i++) ps.spawn(P.STAR, 70 + R.range(-12, 12), -20 + R.range(-16, 8), 0, R.range(-20, -4), 0.6, C[5]);
      }
    },
    drawBack(p) {
      const fade = 1 - smooth(0.4, 1.25, t);
      if (t > 0.28 && fade > 0) {
        p.disc(70, 2, 14, C[1], 0.3 * fade);
        // far chains
        chain(p, 70, -20, 16, fade, C, true);
      }
    },
    draw(p) {
      // flying papers 0-0.28
      for (const pap of papers) {
        const u = clamp((t - pap.delay) / 0.28, 0, 1);
        if (u <= 0) continue;
        const e = ease.outQuart(Math.min(1, u));
        const x = 12 + (70 + Math.cos(pap.a) * 10 - 12) * e;
        const y = -22 + (-20 + Math.sin(pap.a) * 8 + 22) * e;
        const fade = t < 0.9 ? 1 : 1 - smooth(0.9, 1.3, t);
        paper(p, x, y, pap.rot + t * pap.vr, C, fade);
      }
      const fade = 1 - smooth(0.5, 1.3, t);
      if (t >= 0.28 && fade > 0) {
        // seal stamp
        const s = 0.7 + 0.3 * ease.outExpo(clamp((t - 0.28) / 0.08, 0, 1));
        seal(p, 70, -22, 16 * s, C, fade);
        chain(p, 70, -20, 16, fade, C, false);
        if (t < 0.42) sparkle(p, 70, -22, 11, C[5], C[3], 0.9);
        p.glow(70, -20, 28, C[3], 0.35 * fade);
      }
      ps.draw(p);
      lights.draw(p);
    },
  };
}

function paper(p, x, y, rot, C, a) {
  const c = Math.cos(rot), s = Math.sin(rot);
  const pts = [[-3, -4], [3, -4], [3, 4], [-3, 4]].map(([px, py]) => [x + px * c - py * s, y + px * s + py * c]);
  p.poly(pts, C[4], a);
  p.line(x - 1 * c, y - 2 * c, x + 1 * c, y + 3 * c, C[0], a);
}

function seal(p, x, y, r, C, a) {
  p.ring(x, y, r, 2, C[3], a);
  p.ring(x, y, r * 0.7, 1, C[2], a * 0.8);
  // character-like strokes
  p.line(x - 4, y - 3, x + 4, y - 3, C[1], a);
  p.line(x, y - 6, x, y + 5, C[1], a);
  p.line(x - 5, y + 2, x + 5, y + 2, C[1], a);
  p.px(x - 3, y + 5, C[1]);
  p.px(x + 3, y + 5, C[1]);
}

function chain(p, x, y, r, fade, C, back) {
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU + 0.2;
    const isBack = Math.sin(a) < 0;
    if (back !== isBack) continue;
    const x1 = x + Math.cos(a) * r, y1 = y + Math.sin(a) * r * 0.45;
    p.line(x, y, x1, y1, C[2], 0.7 * fade);
    p.px(x1, y1, C[4]);
    p.px(x1 + Math.cos(a) * 3, y1 + Math.sin(a) * 2, C[3]);
  }
}
