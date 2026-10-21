/**
 * PM2 进程配置
 *
 * 常用命令:
 *   pm2 start ecosystem.config.cjs       启动（首次）
 *   pm2 startOrReload ecosystem.config.cjs --update-env   部署时零停机重载
 *   pm2 logs sprite-sheet-tool          查看日志
 *   pm2 restart sprite-sheet-tool       重启
 *   pm2 stop sprite-sheet-tool          停止
 *   pm2 delete sprite-sheet-tool        删除进程
 *
 * 端口通过环境变量调整: PORT=8080 pm2 restart ecosystem.config.cjs --update-env
 */
module.exports = {
  apps: [
    {
      name: 'sprite-sheet-tool',
      script: 'dist-server/server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        COZE_PROJECT_ENV: 'PROD',
        PORT: process.env.PORT || 3000,
        HOST: process.env.HOST || '0.0.0.0',
      },
      // 异常退出自动拉起
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      // 日志按天切割，单文件 10MB、最多保留 7 份
      time: true,
      merge_logs: true,
      max_size: '10M',
      retain: '7',
    },
  ],
};
