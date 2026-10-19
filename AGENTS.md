# 项目上下文

SpriteForge — 纯前端雪碧图（Sprite Sheet）生成工具。多图上传 → 自动排版合并 → Canvas 实时预览 → 导出 PNG + TexturePacker JSON Hash（兼容 Phaser / PixiJS / Cocos Creator）。图片全部在浏览器本地处理，不上传服务器。

## 技术栈

- **核心**: React 19, Vite 7, TypeScript, Express（仅托管前端与 Vite 中间件，无业务 API）
- **UI**: Tailwind CSS 3, lucide-react 图标
- **设计规范**: 见 `DESIGN.md`（深色仪器风工作台，任何 UI 改动前先阅读）

## 目录结构

```
├── scripts/            # 构建与启动脚本（coze 脚手架预置）
│   ├── build.sh        # 构建脚本
│   ├── dev.sh          # 开发环境启动脚本
│   ├── prepare.sh      # 预处理脚本
│   └── start.sh        # 生产环境启动脚本
├── server/             # 服务端逻辑
│   ├── routes/         # API 路由（仅 /api/health）
│   ├── server.ts       # Express 服务入口
│   └── vite.ts         # Vite 中间件集成（createViteServer 必须 configFile:false，见注释）
├── src/                # 前端源码
│   ├── main.tsx        # React 入口
│   ├── App.tsx         # 主组件：状态管理、全局拖拽上传、导出调度
│   ├── index.css       # 全局样式（字体引入、滚动条、棋盘格、滑杆）
│   ├── types/sprite.ts # 核心类型：SpriteImage / PackSettings / PackResult 等
│   ├── lib/
│   │   ├── imageLoader.ts  # 文件过滤、SVG 固有尺寸补齐、透明边缘裁剪、文件名去重
│   │   ├── packing.ts      # 排版算法：Shelf Packing（紧凑）与 Grid（网格）、2 幂对齐
│   │   └── exporter.ts     # 雪碧图渲染、TexturePacker JSON 生成、下载触发
│   └── components/
│       ├── Toolbar.tsx        # 顶部工具栏（统计 + 导出按钮）
│       ├── ImageListPanel.tsx # 左侧素材列表（缩略图/删除/清空，hover 联动高亮）
│       ├── SettingsPanel.tsx  # 右侧设置面板（排版/优化/输出）
│       ├── PreviewCanvas.tsx  # 中央画布预览（棋盘格、滚轮缩放、拖拽平移、帧高亮）
│       └── controls.tsx       # 共享控件（Switch/Slider/SegmentedControl/IconButton）
├── index.html          # 入口 HTML（脚本指向 /src/main.tsx）
├── DESIGN.md           # 视觉与交互设计规范
├── package.json        # 项目依赖管理
├── tsconfig.json       # TypeScript 配置（moduleResolution: bundler, jsx: react-jsx）
└── vite.config.ts      # Vite 配置（@vitejs/plugin-react@5，兼容 Vite 7）
```

## 包管理规范

**仅允许使用 pnpm** 作为包管理器，**严禁使用 npm 或 yarn**。
**常用命令**：
- 安装依赖：`pnpm add <package>`
- 安装开发依赖：`pnpm add -D <package>`
- 安装所有依赖：`pnpm install`
- 移除依赖：`pnpm remove <package>`

## 开发规范

- 使用 Tailwind CSS 进行样式开发；度量/数字/文件名统一 `font-mono`（JetBrains Mono）。
- 主强调色 amber-400，背景 zinc-950，发丝边框 zinc-800；禁止渐变与发光（详见 DESIGN.md）。

### 编码规范

- 默认按 TypeScript `strict` 心智写代码；优先复用当前作用域已声明的变量、函数、类型和导入，禁止引用未声明标识符或拼错变量名。
- 禁止隐式 `any` 和 `as any`；函数参数、返回值、解构项、事件对象、Express `req`/`res`、`catch` 错误在使用前应有明确类型或先完成类型收窄，并清理未使用的变量和导入。
- 类型导入使用 `import type`；React 19 无需默认导入 React。

### 关键实现约定

- 图片处理后帧键为去重后的文件名（`a.png`, `a (1).png`），与 TexturePacker JSON Hash 的 `frames` 键一致。
- `spriteSourceSize` = 裁剪区域在原图中的位置；`frame` = 图块在雪碧图中的位置；网格模式下图块在单元格内居中只影响 `frame`。
- 修改 `vite.config.ts` 或 `server/` 后需重启开发服务（`bash scripts/dev.sh`，脚本会自行清理端口）。
- 服务端全局错误处理器必须保持 4 参签名 `(err, req, res, next)`，否则 Express 会将其视为普通中间件。
