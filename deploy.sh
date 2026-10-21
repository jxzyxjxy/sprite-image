#!/usr/bin/env bash
# =============================================================================
# sprite-sheet-tool 生产环境一键部署脚本
#
# 用法（在项目根目录执行）:
#   bash deploy.sh                 # 安装依赖 + 构建 + 用 PM2 启动/热重载
#   PM2=0 bash deploy.sh           # 构建后直接前台运行（不用 PM2，便于调试）
#   PULL=1 bash deploy.sh          # 部署前先执行 git pull
#   PORT=8080 bash deploy.sh       # 指定服务端口（默认 3000）
#
# 可选环境变量:
#   PORT          服务监听端口（默认 3000）
#   HOST          监听地址（默认 0.0.0.0，对外提供服务无需修改）
#   PM2=0         禁用 PM2，前台直接运行
#   PULL=1        部署前拉取最新代码
#   SKIP_BUILD=1  跳过 pnpm install 与构建（仅重启已有产物）
# =============================================================================
set -Eeuo pipefail

# 切到脚本所在目录（即项目根目录）
cd "$(dirname "$0")"

APP_NAME="sprite-sheet-tool"
PORT="${PORT:-3000}"
HOST="${HOST:-0.0.0.0}"
USE_PM2="${PM2:-1}"
DO_PULL="${PULL:-0}"
SKIP_BUILD="${SKIP_BUILD:-0}"

export COZE_PROJECT_ENV="PROD"
export PORT HOST

log() { echo -e "\033[1;32m[deploy]\033[0m $*"; }
warn() { echo -e "\033[1;33m[deploy WARN]\033[0m $*"; }
err() { echo -e "\033[1;31m[deploy ERROR]\033[0m $*" >&2; }
trap 'err "部署失败（第 $LINENO 行）"' ERR

# ---------------------------------------------------------------------------
# 0. 拉取最新代码
# ---------------------------------------------------------------------------
if [ "$DO_PULL" = "1" ]; then
  log "拉取最新代码 (git pull)..."
  git pull --ff-only
fi

# ---------------------------------------------------------------------------
# 1. 检查 Node.js 与 pnpm
# ---------------------------------------------------------------------------
if ! command -v node >/dev/null 2>&1; then
  err "未检测到 Node.js（需要 Node 20+，建议 24）。请先安装：https://nodejs.org/"
  exit 1
fi
log "Node 版本: $(node -v)"

if ! command -v pnpm >/dev/null 2>&1; then
  err "未检测到 pnpm，正在通过 corepack 启用..."
  corepack enable
  corepack prepare pnpm@latest --activate
fi
log "pnpm 版本: $(pnpm -v)"

# ---------------------------------------------------------------------------
# 2. 安装依赖 + 构建
# ---------------------------------------------------------------------------
if [ "$SKIP_BUILD" = "1" ]; then
  log "SKIP_BUILD=1，跳过依赖安装与构建"
else
  log "安装依赖 (pnpm install --frozen-lockfile)..."
  pnpm install --frozen-lockfile

  log "构建生产产物（Vite 前端 + tsup 服务端）..."
  pnpm run build
fi

# 启动前必须存在服务端产物
if [ ! -f "dist-server/server.js" ]; then
  err "未找到 dist-server/server.js，请去掉 SKIP_BUILD=1 重新执行以完成构建"
  exit 1
fi

# ---------------------------------------------------------------------------
# 3. 启动
# ---------------------------------------------------------------------------
if [ "$USE_PM2" = "0" ]; then
  log "以前台模式启动（http://${HOST}:${PORT}），Ctrl+C 退出..."
  exec node dist-server/server.js
fi

if ! command -v pm2 >/dev/null 2>&1; then
  log "未检测到 pm2，全局安装中..."
  pnpm add -g pm2
fi

log "通过 PM2 启动/热重载 ${APP_NAME}（端口 ${PORT}）..."

# 确保进程处于 online 状态。
# PM2 残留记录（例如历史崩溃循环导致的 "Process with pid already exists"）
# 会使 reload 被静默跳过，此时清理记录后重建进程。
ensure_online() {
  if pm2 describe "${APP_NAME}" 2>/dev/null | grep -q "status.*online"; then
    return 0
  fi
  warn "进程未处于 online 状态，清理 PM2 残留记录后重新启动..."
  pm2 delete "${APP_NAME}" >/dev/null 2>&1 || true
  sleep 1
  pm2 start ecosystem.config.cjs --only "${APP_NAME}" --update-env
  sleep 2
  pm2 describe "${APP_NAME}" 2>/dev/null | grep -q "status.*online"
}

# startOrReload：首次启动，已在运行则零停机重载（名称相同即视为同一应用）
# --update-env：确保 ecosystem 中环境变量（如 PORT）的改动对已存在进程生效
pm2 startOrReload ecosystem.config.cjs --update-env || true
sleep 2
ensure_online || true

log "保存 PM2 进程列表并配置开机自启..."
pm2 save
# 输出开机自启命令（不同系统 init 不同，需人工执行一次返回的 sudo 命令）
pm2 startup | tail -n 1 || true

# ---------------------------------------------------------------------------
# 4. 健康检查（失败时自动再自愈一次，仍失败则输出诊断信息）
# ---------------------------------------------------------------------------
check_health() {
  local i
  for i in $(seq 1 15); do
    if curl -sf --max-time 2 "http://127.0.0.1:${PORT}/api/health" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  return 1
}

log "等待服务健康检查（http://127.0.0.1:${PORT}/api/health）..."
if ! check_health; then
  warn "首轮健康检查未通过，再次清理重建进程后重试..."
  pm2 delete "${APP_NAME}" >/dev/null 2>&1 || true
  sleep 1
  pm2 start ecosystem.config.cjs --only "${APP_NAME}" --update-env || true
fi

if check_health; then
  log "部署完成 ✓ 服务已通过健康检查"
  log "访问地址: http://<服务器IP>:${PORT}（请确认防火墙/安全组已放行该端口）"
else
  err "健康检查未通过：服务未正常监听 ${PORT} 端口，诊断信息如下"
  echo "----- pm2 错误日志（最近 20 行）-----"
  pm2 logs "${APP_NAME}" --err --lines 20 --nostream 2>/dev/null || true
  echo "----- 端口 ${PORT} 监听状态 -----"
  ss -tlnp 2>/dev/null | grep -E ":${PORT}[[:space:]]" || echo "（无任何进程监听 ${PORT}，进程可能已崩溃或处于重启循环）"
  echo "----- 排查建议 -----"
  echo "1) 确认代码为最新版本: git log --oneline -1（不是最新则执行 PULL=1 bash deploy.sh）"
  echo "2) 查看完整日志: pm2 logs ${APP_NAME}"
  echo "3) 前台直跑让报错直接显示: PM2=0 SKIP_BUILD=1 bash deploy.sh"
  exit 1
fi

log "查看日志: pm2 logs ${APP_NAME}"
log "进程状态: pm2 status"
