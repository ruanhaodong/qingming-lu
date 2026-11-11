import Phaser from "phaser";
import { generateAtlas } from "../gen/sprites";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }
  async create() {
    try {
      await Promise.all([
        document.fonts.load('12px "Fusion Pixel 12"'),
        document.fonts.load('10px "Fusion Pixel 10"'),
      ]);
      await document.fonts.ready;
    } catch {
      /* keep going with fallbacks if the font fails to load */
    }
    generateAtlas(this.textures);
    this.scene.start("TitleScene");
  }
}
