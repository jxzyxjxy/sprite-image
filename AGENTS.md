# 项目上下文

sprite-sheet-tool — 纯前端雪碧图（Sprite Sheet）生成工具。多图上传 → 自动排版合并 → 实时预览 → 导出 PNG + TexturePacker JSON Hash（兼容 Phaser / PixiJS / Cocos）。图片全部在浏览器本地处理，不上传服务器。

## 技术栈

- **核心**: React 19, Vite 7, TypeScript 5, Express（仅托管前端与 Vite 中间件，无业务 API）
- **样式**: 原生 CSS（`src/index.css` CSS 变量 + `src/App.css`），设计规范见 `DESIGN.md`
- **构建**: `vite build`（前端 → dist/）+ `tsup`（服务端 → dist-server/）

## 目录结构

```
├── scripts/            # 构建与启动脚本（coze 脚手架预置）
├── server/             # Express 服务（routes/ 仅 /api/health；vite.ts 集成 Vite 中间件）
├── src/
│   ├── main.tsx        # React 入口（#root）
│   ├── App.tsx         # 主组件：图片列表状态、设置状态、防抖 120ms 自动重新生成
│   ├── App.css         # 布局与各组件样式
│   ├── index.css       # CSS 变量（设计 tokens）、全局 reset、滚动条
│   ├── types.ts        # ImageItem / SheetSettings / PlacedFrame / SheetResult 等类型
│   ├── components/     # DropZone / ImageList / SettingsPanel / PreviewPanel
│   └── utils/
│       ├── packer.ts       # 排版算法：Shelf（紧凑，按高度降序）与 Grid（网格，可设列数）、2 幂对齐
│       ├── spritesheet.ts  # 透明边缘裁剪（alpha>8 扫描）、画布合成、TexturePacker JSON 生成
│       └── download.ts     # Blob 下载触发
├── index.html          # 入口（script 指向 /src/main.tsx）
├── vite.config.ts      # plugins:[react()] + base:'./' + 沙箱 server 配置（端口 5000 / HMR 6000）
├── tsconfig.json       # 仅 include src（strict + noUnusedLocals）；vite.config.ts 由 tsconfig.node.json 覆盖
└── DESIGN.md           # 视觉与交互设计规范
```

## 包管理规范

**仅允许使用 pnpm**（`preinstall` 已拦截 npm/yarn）。常用命令：`pnpm add <pkg>` / `pnpm add -D <pkg>` / `pnpm install` / `pnpm remove <pkg>`。

## 开发规范

- 样式使用原生 CSS + `src/index.css` 中的 CSS 变量，新增组件样式写入 `src/App.css`。
- TypeScript strict + `noUnusedLocals/noUnusedParameters`；类型导入用 `import type`。
- 帧键为去重后文件名（`a.png` → `a-1.png`），与 TexturePacker JSON Hash 的 `frames` 键一致。

### 关键实现约定

- 图片/设置变更后防抖 120ms 自动重新排版生成（`App.tsx` useEffect）。
- 裁剪：`spritesheet.ts` 扫描 alpha>8 的包围盒，整图全透明或画布受污染时退回原图。
- `spriteSourceSize` = 裁剪区域在原图中的偏移；`trimmed` = 裁剪前后尺寸是否不同。
- 修改 `vite.config.ts` 或 `server/` 后 tsx watch 会自动重启；端口占用可用 `bash scripts/dev.sh` 重拉。
- `server/vite.ts` 中 `createViteServer` 必须 `configFile: false`（否则 vite.config 被加载两次，React 插件重复注册导致模块转换失败）。
- `server/server.ts` 的全局错误处理器必须保持 4 参签名 `(err, req, res, next)`。
- pnpm 严格布局下 `@vitejs/plugin-react` 构建时需要显式安装 `@babel/preset-typescript`（已在 devDependencies）。
