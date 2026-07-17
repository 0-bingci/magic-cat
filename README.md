# 🐱 magic-cat 魔法猫咪桌宠

一只用 **Tauri 2 + React + TypeScript** 做的桌面宠物：透明、无边框、始终置顶，可以拖到桌面任意角落。会呼吸、眨眼、摇尾巴，还能施放魔法、切换形态、换装、换肤。

## ✨ 功能

- **透明浮窗**：无边框、置顶、可自由拖动
- **点魔法棒 → 法术转盘**：🎨 换肤 / 🔮 专注 / 🍀 好运 / ⏰ 报时 / 🎆 烟花 / 💤 休息 / ❤️ 卖萌
- **点猫 → 形态转盘**：😺 休闲 / ⚔️ 战斗 / 😴 睡觉（躺在小床上）
- **点衣柜 → 换装转盘**：🧙 巫师帽 / 🎀 蝴蝶结 / 👑 皇冠 / 🕶️ 墨镜 / 🎓 学士帽 / 🚫 不戴
- **换肤魔法**：橘猫 / 黑猫 / 白猫 / 灰猫 / 粉猫 循环切换，形态与皮肤、装扮可自由叠加
- **特效**：施法迸发星星、头顶签语气泡、魔法棒尖持续发光
- **右键菜单**：退出

## 🕹 操作一览

| 操作 | 效果 |
| --- | --- |
| 左键按住拖动 | 移动桌宠位置 |
| 左键点魔法棒 | 打开法术转盘 |
| 左键点猫身 / 猫头 | 打开形态转盘 |
| 左键点左下角衣柜 | 打开换装转盘 |
| 点转盘外空白处 | 收起转盘 |
| 右键 | 弹出菜单 → 退出 |

## 🧩 技术栈

- **前端**：React 19 + TypeScript + Vite，界面全部由内联 SVG 绘制（无图片素材）
- **外壳**：Tauri 2（Rust），负责透明窗口、拖拽、置顶、退出等系统能力
- **包管理**：pnpm

## 📁 目录结构

```
magic-cat/
├─ src/                  前端
│  ├─ App.tsx            桌宠主逻辑：猫的 SVG、转盘、拖拽、特效
│  └─ App.css            透明背景 + 所有动画/转盘样式
├─ src-tauri/            Tauri (Rust) 外壳
│  ├─ src/lib.rs         quit 命令、macOS 激活策略
│  ├─ tauri.conf.json    窗口配置（透明/无边框/置顶/尺寸）
│  └─ capabilities/      窗口权限（拖拽/置顶/关闭）
└─ package.json
```

## 🚀 本地开发

需要先装好 **Node.js + pnpm**、**Rust 工具链**；Windows 还需 Microsoft C++ Build Tools 与 WebView2（Win11 一般自带）。

```bash
pnpm install        # 首次安装依赖
pnpm tauri dev      # 启动桌宠（同时跑前端 + 编译 Rust + 弹窗）
```

> 注意：调试桌面应用请用 `pnpm tauri dev`，不要用 `pnpm dev`（后者只在浏览器里开网页版，没有透明窗口和系统能力）。第一次启动会编译较多 Rust 依赖，需要几分钟；之后只需几秒。
>
> 关闭：右键猫选「退出」，或在终端按 `Ctrl + C`。

## 📦 打包

```bash
pnpm tauri build
```

产物在 `src-tauri/target/release/bundle/` 下（Windows 为 `.msi` / `.exe`，macOS 为 `.dmg` / `.app`）。

> Tauri 为原生编译，**不能跨平台交叉打包**：Windows 版需在 Windows 上构建，macOS 版需在 Mac 上构建（或用 GitHub Actions 的 macOS runner）。macOS 透明窗口已通过 `macOSPrivateApi` 适配。

## 🛠 自定义

- 想加/改**法术**：编辑 `src/App.tsx` 里的 `SPELLS`
- 想加/改**皮肤**：编辑 `SKINS`
- 想加/改**装扮**：编辑 `OUTFITS` 并在 `Outfit` 组件里补对应 SVG
- 想改**窗口大小/行为**：编辑 `src-tauri/tauri.conf.json`

## 📄 许可

个人学习 / 娱乐用途。
