import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// MiniMax API 配置
const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
const MINIMAX_API_URL = 'https://api.minimax.chat/v1/text/chatcompletion_pro';

/// 汇率专家System Prompt
const EXPERT_SYSTEM_PROMPT = `你是英镑汇率预测与兑换策略专家，为留学生提供科学、权威的英镑汇率分析和兑换策略指导。

## 核心原则
1. **诚实告知预测局限**：
   - 短期（1-3个月）：预测准确率极低，明确告知用户短期波动受情绪和突发事件影响
   - 中期（3-12个月）：基于宏观基本面和利差提供趋势判断
   - 长期（1年以上）：基于购买力平价提供均衡回归参考
2. **拒绝单点预测，坚持DCA策略**：永远不试图预测或建议"抄底"，主推阶梯兑换法（Dollar Cost Averaging）
3. **消除数据幻觉**：必须基于实时搜索到的最新数据进行分析

## 知识框架
1. **PPP模型（长期）**：GBP/CNY长期均衡区间约8.5-9.0
2. **IRP模型（短期/中期）**：对比英国央行(BoE)和中国央行(PBOC)基准利差
3. **宏观高频因子**：CPI、GDP、就业数据、贸易顺差

## 输出格式要求
在提供策略报告时，必须包含以下模块：

### 1. 📊 市场现状快照
- 当前汇率（实时数据）
- 宏观驱动力总结

### 2. 🔮 多期限趋势研判
- 短期（1-3个月）
- 中期（3-12个月）
- 长期（1年以上）

### 3. 🎲 情景分析预测
使用Markdown表格呈现三种可能性

### 4. 💡 定制化兑换策略 (DCA)
- 分批方案
- 警报阈值设置
- 合规提醒

免责声明：分析结果基于学术模型与宏观数据，仅供参考，不构成Financial Advice。`;

// 主页
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'GBP Exchange Expert API',
    version: '1.1.0',
    apiKeyConfigured: !!MINIMAX_API_KEY,
    endpoints: {
      chat: 'POST /api/chat - 发送消息获取分析',
      rate: 'GET /api/rate - 获取当前汇率',
      health: 'GET /api/health - 健康检查'
    }
  });
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    apiKeyConfigured: !!MINIMAX_API_KEY,
    timestamp: new Date().toISOString()
  });
});

// 获取当前汇率
app.get('/api/rate', async (req, res) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      'https://api.exchangerate-api.com/v4/latest/GBP',
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    const data = await response.json();

    res.json({
      gbpCny: data.rates.CNY,
      gbpUsd: data.rates.USD,
      usdCny: data.rates.CNY / data.rates.USD,
      date: new Date().toISOString(),
      source: 'exchangerate-api'
    });
  } catch (error) {
    res.json({
      gbpCny: 9.2285,
      gbpUsd: 1.2695,
      usdCny: 6.9056,
      date: new Date().toISOString(),
      source: 'fallback',
      note: 'Real-time API unavailable'
    });
  }
});

// 核心聊天接口
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: '消息内容不能为空' });
    }

    // 检查API Key
    if (!MINIMAX_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'MINIMAX_API_KEY未配置，请联系管理员'
      });
    }

    // 构建消息
    const messages = [
      { role: 'system', content: EXPERT_SYSTEM_PROMPT },
      ...history.map(h => ({
        role: h.role,
        content: h.content
      })),
      { role: 'user', content: message }
    ];

    // 调用MiniMax API，设置10秒超时
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(MINIMAX_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MINIMAX_API_KEY}`
        },
        body: JSON.stringify({
          model: 'MiniMax-Text-01',
          messages: messages,
          temperature: 0.7,
          max_tokens: 2000
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('MiniMax API Error:', response.status, errorText);
        throw new Error(`MiniMax API调用失败: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = data.choices?.[0]?.message?.content ||
                              data.choices?.[0]?.text ||
                              '抱歉，暂时无法生成回复，请稍后重试。';

      res.json({
        success: true,
        message: assistantMessage,
        usage: data.usage,
        timestamp: new Date().toISOString()
      });
    } catch (fetchError) {
      clearTimeout(timeout);

      // 检查是否是超时
      if (fetchError.name === 'AbortError') {
        return res.status(504).json({
          success: false,
          error: '请求超时，请稍后重试',
          timestamp: new Date().toISOString()
        });
      }
      throw fetchError;
    }

  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || '服务器内部错误',
      timestamp: new Date().toISOString()
    });
  }
});

// 启动服务器（仅用于本地开发）
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`GBP Exchange Expert Backend running on http://localhost:${PORT}`);
  });
}

export default app;
