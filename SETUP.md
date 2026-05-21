# 环保小兵 · AI 永续校园 — 安装指南
## Eco Warrior League · AI Sustainability Setup Guide

> 适用：老师、IT 协调员、活动负责人
> Audience: teacher / IT coordinator / activity owner

---

## 1. 立即试用（本机模式 · Local-only）

只要起本地服务器（`python -m http.server 8000`）就可以开始用：

### 👨‍👩‍👧 访客模式（家长 / 学生 · 不用登入）

打开 URL 直接看：
- ✅ 📋 物品图鉴 — 浏览 50 个回收物 + 处理脚本
- ✅ 📊 战况 — 比赛排行
- ✅ 🎁 奖品 — 基金概况 + 库存（只能看，不能改）
- ✅ 🔁 永续闭环 — 校园数据可视化

### 👨‍🏫 老师模式（需要登入）

按右上角 **🔓 老师登入**，输入：
- 账号 ID：`JBC9008`
- 密码：`JBC9008`

登入后多出 3 个功能：
- ✅ 📝 记录 — 记录每次回收重量
- ✅ ⭐ 环保星 — 加星 / 扣星（扣星必填理由）
- ✅ ⚙️ 管理 — 比赛设置 / CSV 导出
- ✅ 在「图鉴」可以**奖励学生星星** + 用 AI 兜底
- ✅ 在「奖品」可以**兑换** + 加新奖品 + 记基金

> ⚠️ 🤖 AI 扫描 — **登入老师 + 完成第 2 步 (Edge Function)** 才能用

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

## 3. 五个模式 · 5 Modes

| 按钮 | 谁能看 | 谁能改 | 用途 |
|---|---|---|---|
| 📊 **战况** | 👨‍👩‍👧 所有人 | — | 回收比赛 (kg, RM, 队伍排行) |
| 🎁 **奖品** | 👨‍👩‍👧 所有人 | 🔒 老师 | 学生 ⭐ 排行 + 礼物列表 + 兑换 |
| 📝 记录 | 🔒 老师 | 🔒 老师 | 称重输入（按 RM/kg 自动算分） |
| 🤖 AI | 🔒 老师 | 🔒 老师 | 拍照分析回收物（混合材料拆解） |
| ⚙️ 管理 | 🔒 老师 | 🔒 老师 | Session / 类别价格 / CSV / 重置 |

### 🔓 登入说明
- 默认进入 = 📊 **战况**（家长 / 学生直接看到）
- 公开模式只显示 2 个 chip：战况 + 奖品
- 点 `🔓 老师登入`（右上）或者点任何老师才能改的按钮 → 弹登入框
- 登入后模式栏自动展开成 5 个

### ⭐ 星星类型（已分组，避免混淆）
- **🌱 环保类**（与回收比赛挂钩）：♻️ 回收 / 📄 纸张 / 💡 节电 / 💧 节水 / 🌱 校园
- **📚 学业品格类**（全方位奖励）：📚 学业 / ⭐ 品格 / 🤝 助人 / 🧭 领导
- **⚠️ 扣星**（必填原因）

### 🎁 奖品流程
1. 老师在 📝 记录 称重 → 回收物自动变 RM
2. 学校用 RM 买奖品 → 老师在 🎁 奖品「管理奖品」加入库存
3. 老师在战况期间用 🎁 奖品页的 `+ ⭐` 按钮快速给学生加星
4. 学生用累计的 ⭐ 在 🎁 奖品兑换

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
├── styles.css              ← 完整样式（含手机适配）
├── data.js                 ← 状态管理 + 全部 helpers
├── cloud-sync.js           ← Supabase 实时同步
├── ai-client.js            ← AI 调用客户端
├── components.jsx          ← 模式切换 (5 个模式)
├── tweaks-panel.jsx
├── mobile-view.jsx         ← 📝 记录
├── bigscreen-view.jsx      ← 📊 战况
├── admin-view.jsx          ← ⚙️ 管理
├── ai-scan-view.jsx        ← 🤖 AI 扫描
├── reward-corner-view.jsx  ← 🎁 奖品 (含星星排行 + 兑换)
├── app.jsx                 ← 主 App + 登入 modal
├── catalog.js              ← (留 git，未挂入 index.html)
├── catalog-view.jsx        ← (留 git，未挂入 index.html)
├── star-ledger-view.jsx    ← (留 git，功能并入 reward-corner)
├── eco-loop-dashboard.jsx  ← (留 git，未挂入 index.html)
└── supabase/
    └── functions/
        └── analyze-recyclable/
            └── index.ts    ← Edge Function (gpt-4o + 8 个 few-shot)
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
