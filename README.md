# GBP Exchange Expert Backend

英镑汇率专家后端服务 - 基于MiniMax AI的实时汇率分析API。

## 🚀 快速部署到 Vercel

### 方式一：一键部署（推荐）

点击下方按钮：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/liuxiaoxuanmmj/gbp-exchange-expert-backend)

### 方式二：手动部署

```bash
# 克隆仓库
git clone https://github.com/liuxiaoxuanmmj/gbp-exchange-expert-backend.git
cd gbp-exchange-expert-backend

# 安装 Vercel CLI
npm i -g vercel

# 登录并部署
vercel

# 设置环境变量
vercel env add MINIMAX_API_KEY
```

## ⚙️ 环境变量

部署时需要设置以下环境变量：

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `MINIMAX_API_KEY` | ✅ | MiniMax API密钥 |

## 📡 API端点

部署后可通过以下端点访问：

| 端点 | 方法 | 说明 |
|------|------|------|
| `/` | GET | 服务信息 |
| `/api/health` | GET | 健康检查 |
| `/api/rate` | GET | 获取当前GBP/CNY汇率 |
| `/api/chat` | POST | 发送消息获取AI分析 |

### 示例请求

```bash
# 健康检查
curl https://your-app.vercel.app/api/health

# 获取汇率
curl https://your-app.vercel.app/api/rate

# 发送消息
curl -X POST https://your-app.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "帮我分析英镑走势", "history": []}'
```

## 🛠️ 本地开发

```bash
# 安装依赖
npm install

# 复制环境变量文件
cp .env.example .env
# 编辑 .env 添加你的 MINIMAX_API_KEY

# 启动服务
npm start

# 服务运行在 http://localhost:3000
```

## 📦 技术栈

- Node.js + Express
- MiniMax API
- Vercel Serverless Functions
