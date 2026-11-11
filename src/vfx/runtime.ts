import { createFrame, clearFrame, createFx, composite } from "pixelfx";
import { getFx, type FxMod } from "./catalog";

export interface LiveFx {
  id: string;
  inst: any;
  meta: any;
  back: Phaser.GameObjects.Image;
  front: Phaser.GameObjects.Image;
  texB: Phaser.Textures.CanvasTexture;
  texF: Phaser.Textures.CanvasTexture;
  keyB: string;
  keyF: string;
  loop: boolean;
  done: boolean;
  follow?: () => { x: number; y: number; depth: number };
  x: number;
  y: number;
  depth: number;
}

let seq = 0;

export class FxRuntime {
  scene: Phaser.Scene;
  list: LiveFx[] = [];
  weather: LiveFx | null = null;
  frozen = 0;
  shake = 0;
  shakeAmp = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  play(id: string, x: number, y: number, opts: Record<string, unknown> = {}, depth = y): LiveFx | null {
    const mod = getFx(id);
    if (!mod) {
      console.warn("missing fx", id);
      return null;
    }
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(opts)) if (v !== undefined) clean[k] = v;
    try {
      return this.spawn(id, mod, x, y, clean, depth);
    } catch (err) {
      console.warn("fx play failed", id, err);
      return null;
    }
  }

  private spawn(id: string, mod: FxMod, x: number, y: number, opts: Record<string, unknown>, depth: number): LiveFx {
    const meta = mod.meta;
    const [w, h] = meta.size;
    const [ox, oy] = meta.origin;
    const inst = createFx(mod, { x: ox, y: oy, ...opts });
    const n = ++seq;
    const keyB = `fxb_${n}`;
    const keyF = `fxf_${n}`;
    const cB = document.createElement("canvas");
    cB.width = w; cB.height = h;
    const cF = document.createElement("canvas");
    cF.width = w; cF.height = h;
    const texB = this.scene.textures.addCanvas(keyB, cB)!;
    const texF = this.scene.textures.addCanvas(keyF, cF)!;
    const back = this.scene.add.image(x, y, keyB);
    const front = this.scene.add.image(x, y, keyF);
    back.setOrigin(ox / w, oy / h);
    front.setOrigin(ox / w, oy / h);
    back.setDepth(depth - 1);
    front.setDepth(depth + 8);
    const live: LiveFx = {
      id, inst, meta, back, front, texB, texF, keyB, keyF,
      loop: !!meta.loop, done: false, x, y, depth,
    };
    this.list.push(live);
    this.blit(live);
    return live;
  }

  playWeather(id: string | null) {
    if (this.weather) {
      this.weather.inst.stop?.();
      // leave it to fade via done()
      this.weather.loop = false;
      this.weather = null;
    }
    if (!id) return;
    const cam = this.scene.cameras.main;
    const live = this.play(id, cam.width / 2, 36, { light: 0.55 }, 6);
    if (live) {
      live.back.setScrollFactor(0);
      live.front.setScrollFactor(0);
      live.follow = () => ({
        x: this.scene.cameras.main.width / 2,
        y: 36,
        depth: 6,
      });
      this.weather = live;
    }
  }

  update(dt: number) {
    if (this.frozen > 0) {
      this.frozen = Math.max(0, this.frozen - dt);
    }
    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt);
      const a = this.shakeAmp * (this.shake);
      this.scene.cameras.main.shake(Math.min(80, this.shake * 1000), a / 40);
    }
    const step = this.frozen > 0 ? 0 : dt;
    for (const fx of this.list) {
      if (step > 0) fx.inst.update(step);
      if (fx.follow) {
        const p = fx.follow();
        fx.x = p.x; fx.y = p.y; fx.depth = p.depth;
      }
      fx.back.setPosition(fx.x, fx.y).setDepth(fx.depth - 1);
      fx.front.setPosition(fx.x, fx.y).setDepth(fx.depth + 8);
      this.blit(fx);
      if (fx.inst.done()) fx.done = true;
    }
    for (const fx of this.list.filter((f) => f.done)) this.kill(fx);
    this.list = this.list.filter((f) => !f.done);
  }

  hitStop(t: number, shake = 0, amp = 2) {
    this.frozen = Math.max(this.frozen, t);
    if (shake > 0) {
      this.shake = Math.max(this.shake, shake);
      this.shakeAmp = Math.max(this.shakeAmp, amp);
    }
  }

  private blit(fx: LiveFx) {
    const [w, h] = fx.meta.size;
    const frameB = createFrame(w, h);
    const frameF = createFrame(w, h);
    fx.inst.draw(frameB, "back");
    fx.inst.draw(frameF, "front");
    const imgB = fx.texB.context.createImageData(w, h);
    const imgF = fx.texF.context.createImageData(w, h);
    composite(frameB, imgB.data, null);
    composite(frameF, imgF.data, null);
    fx.texB.putData(imgB, 0, 0);
    fx.texF.putData(imgF, 0, 0);
    fx.texB.refresh();
    fx.texF.refresh();
  }

  kill(fx: LiveFx) {
    fx.back.destroy();
    fx.front.destroy();
    if (this.scene.textures.exists(fx.keyB)) this.scene.textures.remove(fx.keyB);
    if (this.scene.textures.exists(fx.keyF)) this.scene.textures.remove(fx.keyF);
  }

  destroy() {
    for (const fx of this.list) this.kill(fx);
    this.list = [];
    this.weather = null;
  }
}

export function actOf(id: string): any | undefined {
  return getFx(id)?.act;
}
