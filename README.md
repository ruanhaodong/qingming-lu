# 青冥录

像素等距修仙网页游戏。在线试玩：[https://ruanhaodong.github.io/qingming-lu/](https://ruanhaodong.github.io/qingming-lu/)。主角默认「青行」，是青冥村一名灵根驳杂的药农之子，不是天选之人。主线见 `docs/MAIN-STORY.md`。

引擎：Phaser 4.2.1。特效：PixelFX 0.3.0（MIT，Patch / [patch-gg/pixelfx](https://github.com/patch-gg/pixelfx)）在战斗中实时合成。

## 运行

```bash
cd qingming-lu
npm install
npm run dev      # http://localhost:5173
```

构建与预览：

```bash
npm run build
npm run preview  # http://localhost:4173
```

## 操作

- 移动：WASD / 方向键，或左下角摇杆（触屏）
- 技能：键盘 1–4，或右下角技能格
- E / 空格 /「交互」：交谈、采集、进入、开箱
- F /「收服」：对残血可收服目标使用拘灵符
- B 背包  C 修炼  K 技能  M 地图  Q 任务  Esc 关闭或菜单

全部按钮画在 Canvas 上，页面关闭了默认触控滚动与缩放。

## 系统

境界、法宝品阶、灵兽收服、技能拆分合成自创、门派阵营、炼器炼丹、副本、大世界与区域地图、随机事件、任务、拍卖与交易。本地 `localStorage` 自动存档。

打坐时若已探入青泉石室，识海中的「青泉残韵」只会略微精炼驳杂灵气，不能升级法宝、凭空出丹或瞬间改命。
