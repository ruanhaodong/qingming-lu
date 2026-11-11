import Phaser from "phaser";
import { generateAtlas } from "../gen/sprites";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }
  create() {
    generateAtlas(this.textures);
    this.scene.start("TitleScene");
  }
}
