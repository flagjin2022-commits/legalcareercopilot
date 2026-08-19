# Legal Career Copilot

Legal Career Copilot 是面向法学生求职与实习的 AI 辅助分析工具。用户粘贴招聘信息、上传 PDF/DOCX 简历并选择求职场景后，系统通过 DeepSeek 识别岗位要求、匹配简历证据、诊断表达并生成面试准备建议。

当前版本为第一轮 **Beta 内测版**，目标是支持 5–10 名真实用户独立完成分析并提交可统计的产品反馈。项目不包含用户账户、会员、支付或业务数据库。

## 技术栈

- Next.js 16（App Router）
- React 19 + TypeScript
- Tailwind CSS
- Lucide React
- Recharts
- DeepSeek Chat Completions API
- Mammoth / unpdf（DOCX、PDF 文本提取）

## 本地运行

要求 Node.js 22 或更高版本（PDF 解析依赖需要 Node.js 22+）。

```bash
npm install
copy .env.example .env.local
npm run dev
```

在 `.env.local` 配置：

```dotenv
DEEPSEEK_API_KEY=你的密钥
DEEPSEEK_MODEL=deepseek-v4-flash
BETA_ACCESS_CODE=你的内测码
BETA_ADMIN_PASSWORD=内部反馈页密码
BETA_SESSION_SECRET=至少32位随机字符串
BETA_DATA_DIR=.data
```

打开 [http://localhost:3000](http://localhost:3000)。

质量检查：

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Beta 用户流程

1. 首次访问 `/beta-access` 输入内测码，随后进入首页和 `/upload`。
2. 填写 JD，上传 PDF/DOCX 简历。
3. 选择使用目的、教育阶段、目标职业场景、最多两个专业方向及 AI 分析重点。
4. `/analyzing` 调用 `/api/analyze-job`，服务端请求 DeepSeek。
5. `/report` 展示真实报告；没有有效报告时自动返回上传页。
6. 真实报告末尾可提交结构化 Beta Feedback；示例报告不会进入统计。

## 数据与隐私边界

- 上传文件仅在请求内存中提取文字，项目不会将原始文件写入磁盘。
- JD、简历文字、分析上下文和报告暂存在浏览器 `sessionStorage`，也可在报告页点击“清除本次分析数据”。
- JD 与简历提取文字会发送给第三方大模型 DeepSeek 完成分析。
- Beta Feedback 不保存原始 JD 或简历；保存匿名场景、结构化选择、开放反馈以及必要的报告结构化摘要。
- 每次真实分析生成独立 UUID analysisId；不使用姓名、文件名、学校或联系方式作为标识。
- 结构化 Analysis Snapshot 与 Feedback 按 analysisId 关联。第三方 DeepSeek 对请求内容的处理仍受其服务条款与数据政策约束。

## Feedback 持久化

本地开发默认追加保存到 `.data/beta-analyses.jsonl` 和 `.data/beta-feedback.jsonl`。关闭网页或重启开发服务器后仍可读取。

生产环境使用 Supabase Postgres，通过服务端 REST 适配器保存；不会使用 Vercel 等 serverless 平台的临时文件系统。首次配置：

1. 在 Supabase 新建项目。
2. 在 SQL Editor 执行 `supabase/beta-schema.sql`。
3. 在部署平台配置 `SUPABASE_URL` 和仅服务端使用的 `SUPABASE_SECRET_KEY`。
4. 不要创建以 `NEXT_PUBLIC_` 开头的 Secret 环境变量。

内部反馈页为 `/internal/beta-feedback`，使用 `BETA_ADMIN_PASSWORD` 保护，可查看汇总、展开单条记录并导出 JSON/CSV。

## 部署到 Vercel

项目使用标准 Next.js App Router 与 Node.js Route Handlers，可直接由 Vercel 识别。使用 Node.js 22 或更高版本，Build Command 保持 `npm run build`，不要设置自定义 Output Directory。

部署前先在 Supabase SQL Editor 执行 `supabase/beta-schema.sql`，然后在 Vercel 的 Production 环境配置：

| 环境变量 | 是否必需 | 是否 Secret | 用途 |
| --- | --- | --- | --- |
| `DEEPSEEK_API_KEY` | 是 | 是 | 服务端调用 DeepSeek |
| `DEEPSEEK_MODEL` | 否 | 否 | 模型名称，默认使用示例值 |
| `BETA_ACCESS_CODE` | 是 | 是 | Beta 访问码 |
| `BETA_ADMIN_PASSWORD` | 是 | 是 | 内部反馈页密码 |
| `BETA_SESSION_SECRET` | 是 | 是 | 签名 Beta Cookie，建议至少 32 位随机字符串 |
| `SUPABASE_URL` | 是 | 否 | Supabase 项目地址；本项目仍仅在服务端读取 |
| `SUPABASE_SECRET_KEY` | 是 | 是 | 服务端写入 Analysis Snapshot 与 Feedback |

Vercel 不应配置 `BETA_DATA_DIR`，并保持 `ALLOW_LOCAL_BETA_STORAGE=false` 或不配置。所有 Secret 都不得使用 `NEXT_PUBLIC_` 前缀。

部署完成后的最小验收流程：

1. 使用内测码通过 `/beta-access`。
2. 在 `/upload` 粘贴 JD，并分别验证 PDF 与 DOCX 简历解析。
3. 完成 `/analyzing` → `/report`，确认报告来源为真实 DeepSeek 分析。
4. 提交一次 Feedback，并在 `/internal/beta-feedback` 确认记录可读取。
5. 在 Vercel 日志中确认没有完整简历文本、API Key 或内部错误堆栈输出。

## 最低接口保护

- `/api/analyze-job`、`/api/parse-resume` 与 `/api/feedback` 需要有效 Beta Cookie。
- 内测码和管理密码只从服务端环境变量读取，Cookie 使用 HMAC 签名、HttpOnly、SameSite=Lax，生产环境启用 Secure。
- API 设置请求大小上限、单实例基础限流和不含内部 stack 的错误响应。
- DeepSeek API Key、Supabase Secret 和 Beta Code 均不进入客户端 bundle。
- 基础限流为 serverless 实例内限流；正式公开推广前仍应增加部署平台防火墙或分布式限流。

## 主要目录

```text
src/
├── app/                 # 页面与 Route Handlers
├── components/          # 上传、分析、报告与反馈组件
├── lib/                 # Prompt、校验、Mock、会话存储与报告组装
├── services/            # DeepSeek、简历解析、反馈持久化
└── types/               # Report 与 Beta Feedback 类型
```

## 暂未包含

- 用户注册登录与分析历史
- 正式隐私政策和复杂授权流程
- 大规模公开流量所需的分布式限流
- OCR、多模型、Agent orchestration
- 正式商业管理后台
