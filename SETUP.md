# 环保小兵 · AI 永续校园 — 安装指南
## Eco Warrior League · AI Sustainability Setup Guide

> 适用：老师、IT 协调员、活动负责人
> Audience: teacher / IT coordinator / activity owner

---

## 1. 立即试用（本机模式 · Local-only）

只要双击 `index.html` 就可以开始用：
- ✅ 回收比赛（录入、战况、管理）— 立刻可用
- ✅ ⭐ 环保星账本 — 立刻可用
- ✅ 🎁 奖励角落 — 立刻可用
- ✅ 🔁 永续闭环面板 — 立刻可用
- ⚠️ 🤖 AI 扫描 — **需要先完成第 2 步**

登入：
- 账号 ID：`JBC9008`
- 密码：`JBC9008`

---

## 2. 启用 AI 扫描（要做 3 件事）

### 2.1 拿 OpenAI API key

1. 去 https://platform.openai.com/api-keys
2. Create new secret key — 起名 `eco-warrior`
3. 复制 `sk-...` 字串。**不要让它出现在浏览器或 GitHub。**

> 💰 选用 **gpt-4o-mini**：USD $5 约可扫 **10,000 次**。一年一个班用不完。

### 2.2 部署 Supabase Edge Function

在电脑装好 [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) 后：

```bash
# 1. 登入并连到现有 project (ibdkcdfwzflolyzhkitt)
supabase login
supabase link --project-ref ibdkcdfwzflolyzhkitt

# 2. 把 API key 存进 Edge Function 的 secrets（不会暴露）
supabase secrets set OPENAI_API_KEY=sk-你的key
supabase secrets set OPENAI_MODEL=gpt-4o-mini

# 3. 部署（项目里已经有 supabase/functions/analyze-recyclable/）
supabase functions deploy analyze-recyclable --no-verify-jwt
```

> `--no-verify-jwt` 让前端用 anon key 就能调用，不必登入 Supabase Auth。
> 安全靠 Edge Function 自己的 API 限制（图片大小、CORS）。

### 2.3 确认 `index.html` 里 Supabase 配置正确

打开 `index.html`，找到：

```html
<script>
window.SUPABASE_CONFIG = {
  url:     "https://ibdkcdfwzflolyzhkitt.supabase.co",
  anonKey: "sb_publishable_..."
};
</script>
```

已经预填了。如果换 project，更新这两行就好。

### 2.4 测试

1. 打开 App → 点 `🤖 AI扫描`
2. 选一个学生（可选）
3. 按 `📸 拍照` 或 `🖼️ 选照片`
4. 按 `✨ 开始 AI 分析`
5. 几秒后看到分析卡 → `🌟 奖励环保星`

---

## 3. 七个模式 · 7 Modes（混合模式 · Hybrid）

| 按钮 | 功能 | 谁会用 | 是否要 AI |
|---|---|---|---|
| 📝 录入 | 老师输入每次回收重量 | 比赛日老师 | ❌ |
| 📋 **图鉴** | **学生点物品 → 看脚本 → 奖星**（默认入口） | 学生 / 老师日常 | ❌ 完全免费 |
| 📊 战况 | 大屏幕显示比赛进度 | 校园电视 / 投影 | ❌ |
| ⭐ 环保星 | 记录环保 / 品格 / 校园星 | 老师日常 | ❌ |
| 🎁 奖品 | 兑换、库存、基金 | 协调老师 | ❌ |
| 🔁 闭环 | 永续行为闭环面板 | 公开展示 | ❌ |
| ⚙️ 管理 | 比赛设置、CSV 导出 | 管理员 | ❌ |

> 🤖 **AI 扫描藏在「图鉴」里面**：图鉴找不到的物品才用 AI（一次约 USD $0.005）。
> AI 分析完，按 **`💾 加入图鉴`** → 这个物品**下次永远免费**。
> 这个设计让 App 越用越聪明、越用越便宜。

---

## 4. 关键设计原则

1. **API key 永远不在浏览器**
   - 浏览器 → Supabase Edge Function → OpenAI
   - 任何人 view-source 都看不到 OpenAI key
2. **扣星必须填理由**
   - data.js `addStarEvent` 强制检查
3. **AI 结果可被老师覆写**
   - 「批准 / 仅保存 / 奖励星」三个按钮
4. **保持双语 UI（中文 + 英文）**
   - 学生看中文，外部参访可读英文
5. **不改变现有比赛机制**
   - 两队 / Session / 重量录入 全部原样

---

## 5. 数据存哪？

| 资料 | 存哪 | 备份方式 |
|---|---|---|
| 全部状态 | localStorage `eco_warrior_v2` | Supabase `app_state` 单行 JSON |
| AI 扫描照片 | **不保存**（只保存分析 JSON） | — |
| OpenAI key | Supabase Edge Function secret | 只在 Supabase 后台 |

→ 删除 Supabase 那行 / 清浏览器 localStorage = 完全重置

---

## 6. 成本

| 用法 | 单次 USD | $5 可用 |
|---|---|---|
| 📋 **图鉴查询**（默认） | **$0**（完全本地） | **♾️ 无限** |
| 🤖 AI 扫描（gpt-4o, 仅图鉴外） | ~$0.005 | ≈ 1,000 次 |
| Supabase 同步 | 免费 (free tier) | 无限 |
| Edge Function | 免费 (free tier, 500K calls/month) | 无限 |

→ **实际成本**：图鉴覆盖 95% 场景。一年烧 AI 的钱大概 **USD$1–3**。  
→ 你那 $5 余额可以撑 **2-5 年**。真正环保的设计 🌱

---

## 7. 故障排查

| 现象 | 处理 |
|---|---|
| 「AI 未启用」红框 | 检查 `index.html` SUPABASE_CONFIG / 部署 Edge Function |
| 「OPENAI_API_KEY is not configured」 | `supabase secrets set OPENAI_API_KEY=...` 再 redeploy |
| 一直「分析中…」转不停 | 看浏览器 console — 多半是 CORS 或 Edge Function 没部署 |
| 「Image too large」 | 客户端已经压到 1280px，再大请直接重拍 |
| 星星余额对不上 | 检查 `奖品兑换` 是否扣到错的学生 |
| 想清空所有数据 | 管理 → 重置赛季；或浏览器 DevTools 删 localStorage |

---

## 8. 文件清单

```
环保小兵/
├── index.html              ← 入口
├── styles.css              ← 完整样式
├── catalog.js              ← 50 个物品图鉴种子 (新)
├── data.js                 ← 状态管理 + 全部 helpers
├── cloud-sync.js           ← Supabase 实时同步
├── ai-client.js            ← AI 调用客户端
├── components.jsx          ← 模式切换 (7 个模式)
├── tweaks-panel.jsx
├── mobile-view.jsx         ← 录入
├── bigscreen-view.jsx      ← 战况
├── admin-view.jsx          ← 管理
├── catalog-view.jsx        ← 📋 物品图鉴 (新 · 主入口)
├── ai-scan-view.jsx        ← 🤖 AI 扫描 (隐藏入口，图鉴内可调用)
├── star-ledger-view.jsx    ← ⭐ 环保星账本
├── reward-corner-view.jsx  ← 🎁 奖励角落
├── eco-loop-dashboard.jsx  ← 🔁 永续闭环
├── app.jsx                 ← 主 App
└── supabase/
    └── functions/
        └── analyze-recyclable/
            └── index.ts    ← Edge Function
```

---

## 9. 下一步（Phase C，可选）

现在所有新数据塞在 `app_state` 单行 JSON 里。当全校开始用，建议：

1. 把 `aiScans` / `starLedger` / `rewardRedemptions` 拆成独立 Supabase 表
2. 用 Supabase Auth 给每个老师独立账号
3. 启用 Supabase Storage 存照片（如果有需要）
4. 启用 RLS（Row Level Security）

参考 `eco_ai_expansion_blueprint/sql/supabase_phase2_schema.sql`。

— 祝顺利 🌱
