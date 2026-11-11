import Phaser from "phaser";
import { FONT, FONT_SM } from "../hud/Hud";
import { GameState } from "../state";
import { HEIGHT, WIDTH } from "../types";
import { FxRuntime } from "../vfx/runtime";

const NAMES = ["青行", "阿宁", "无尘", "小鱼", "赤衣", "冷疏", "晚照"];

export class TitleScene extends Phaser.Scene {
  fx?: FxRuntime;
  nameI = 0;
  nameText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "TitleScene" });
  }

  create() {
    this.cameras.main.setBackgroundColor(0x68b8e8);
    if (this.textures.exists("title_bg")) {
      this.add.image(0, 0, "title_bg").setOrigin(0, 0).setDepth(0);
    }
    this.fx = new FxRuntime(this);
    this.add.rectangle(WIDTH / 2, HEIGHT - 22, WIDTH, 36, 0x08140e, 0.72).setDepth(190);

    // lacquer plaque behind the title only — taglines sit below the frame
    this.add.rectangle(WIDTH / 2, 70, 300, 36, 0x0e1612, 0.82).setStrokeStyle(1, 0x80c0a0).setDepth(180);
    this.add.rectangle(WIDTH / 2, 70, 288, 24, 0x121c16, 0.0).setStrokeStyle(1, 0x3a6a50).setDepth(180);
    for (const [x, y, ox, oy] of [
      [WIDTH / 2 - 150, 52, 1, 1],
      [WIDTH / 2 + 150, 52, -1, 1],
      [WIDTH / 2 - 150, 88, 1, -1],
      [WIDTH / 2 + 150, 88, -1, -1],
    ] as const) {
      this.add.rectangle(x, y, 10, 1, 0xc0e8d0).setOrigin(ox < 0 ? 1 : 0, 0.5).setDepth(181);
      this.add.rectangle(x, y, 1, 10, 0xc0e8d0).setOrigin(0.5, oy < 0 ? 1 : 0).setDepth(181);
    }

    this.add.text(WIDTH / 2, 70, "青 冥 录", {
      fontFamily: FONT, fontSize: "36px", color: "#d8ffe8", resolution: 1,
    }).setOrigin(0.5).setDepth(200);
    this.add.text(WIDTH / 2, 100, "青冥村的药农之子。灵根驳杂，不是天选之人。", {
      fontFamily: FONT, fontSize: "12px", color: "#80c0a0", resolution: 1,
    }).setOrigin(0.5).setDepth(200);
    this.add.text(WIDTH / 2, 116, "只想小心活着，把每一分资源用到尽处。", {
      fontFamily: FONT, fontSize: "12px", color: "#6aa888", resolution: 1,
    }).setOrigin(0.5).setDepth(200);

    this.nameText = this.add.text(WIDTH / 2, 148, `姓名：${NAMES[this.nameI]}`, {
      fontFamily: FONT, fontSize: "12px", color: "#e8f8f0", resolution: 1,
    }).setOrigin(0.5).setDepth(200);

    this.mkBtn(WIDTH / 2, 172, 120, 20, "更换姓名", () => {
      this.nameI = (this.nameI + 1) % NAMES.length;
      this.nameText?.setText(`姓名：${NAMES[this.nameI]}`);
    });
    this.mkBtn(WIDTH / 2, 204, 140, 22, "新的旅程", () => {
      const st = GameState.newGame(NAMES[this.nameI], 42 + this.nameI * 17);
      this.scene.start("WorldScene", { state: st });
    });
    if (GameState.hasSave()) {
      this.mkBtn(WIDTH / 2, 240, 140, 22, "继续修行", () => {
        const st = GameState.load();
        if (st) this.scene.start("WorldScene", { state: st });
      });
    }
    this.add.text(WIDTH / 2, HEIGHT - 28, "WASD 移动  1-4 技能  E 交互   触屏可用摇杆与按钮", {
      fontFamily: FONT_SM, fontSize: "10px", color: "#609080", resolution: 1,
    }).setOrigin(0.5).setDepth(200);
    this.add.text(WIDTH / 2, HEIGHT - 14, "特效 PixelFX  ·  MIT  ·  Patch / patch-gg/pixelfx", {
      fontFamily: FONT_SM, fontSize: "10px", color: "#406858", resolution: 1,
    }).setOrigin(0.5).setDepth(200);

    this.events.on("shutdown", () => this.fx?.destroy());
  }

  mkBtn(x: number, y: number, w: number, h: number, label: string, fn: () => void) {
    const r = this.add.rectangle(x, y, w, h, 0x1c2c24, 0.95).setStrokeStyle(1, 0x80c0a0).setInteractive().setDepth(200);
    this.add.text(x, y, label, { fontFamily: FONT, fontSize: "12px", color: "#e8f8f0", resolution: 1 }).setOrigin(0.5).setDepth(201);
    r.on("pointerover", () => r.setFillStyle(0x2a4a38));
    r.on("pointerout", () => r.setFillStyle(0x1c2c24));
    r.on("pointerdown", fn);
  }

  update(_t: number, d: number) {
    this.fx?.update(Math.min(0.05, d / 1000));
  }
}
