import { Router } from 'express';

const router = Router();

// 健康检查接口（本应用为纯前端工具，图片处理全部在浏览器内完成，无业务 API）
router.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    env: process.env.COZE_PROJECT_ENV,
    timestamp: new Date().toISOString(),
  });
});

export default router;
