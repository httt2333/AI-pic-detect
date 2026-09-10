# AI-PIC-DETECT UI Agent 交接文档

更新时间：2026-09-10  
交接版本：`6bc6483 feat: refine landing scan and fixed pricing navigation`

## 目标与边界

AI-PIC-DETECT 是面向二次元人物图创作者的发布前局部问题检查工具。UI 应表达：

上传一张图 → 找到值得人工复核的局部 → 解释原因 → 给出修改建议。

不要把产品描述成 AI 真假鉴定，不输出确定性结论、版权裁决或作者身份判断。当前优先级是专业 Landing Page 和稳定的 P0 检测闭环；不要擅自扩展未确认的 P1/P2 功能。

## 当前页面与代码入口

- Landing / 首屏与故事段落：`src/features/ai-pic-detect/landing-page.tsx`
- 上传、分析、结果工作区：`src/features/ai-pic-detect/review-experience.tsx`
- 统一 Mock 响应：`src/features/ai-pic-detect/mock-response.ts`
- Pricing：`src/app/[locale]/(landing)/pricing/page.tsx`
- 登录页：`src/shared/blocks/sign/sign-in.tsx`
- 检查记录：`src/features/ai-pic-detect/review-history.tsx`
- 图片素材：`public/images/ai-pic-detect/`

## 已完成 UI 行为

- Landing 首屏展示产品价值、示例扫描效果、上传 CTA、核心能力、使用流程和边界说明。
- Hero 扫描线首次进入自动从右向左演示一次，展示两个示例问题；动画结束停留在结果态。
- 用户 hover、点击、拖动、触摸或键盘操作时立即接管扫描线。
- 自动扫描使用 `requestAnimationFrame` 和 DOM refs，避免每帧触发 React 重渲染。
- 结果页左侧图片与 bbox 标记，右侧问题列表和当前问题详情；点击列表或 bbox 可互相切换。
- 结果报告位于图片与单点详情下方，避免把左侧图片拉成长框。
- 支持 `idle / uploading / analysing / success / no_issue / unsupported / timeout / analysis_failed` 状态。
- Pricing 使用中文完整固定导航：使用流程、产品边界、购买额度、检查记录、登录、开始检查。
- 购买按钮在真实支付 Provider 和价格配置完成前保持禁用/测试态。

## 视觉与交互约束

- 桌面端优先，移动端只要求不破坏可用性。
- 保持当前紫色强调色、浅色背景、黑色高对比标题和编辑感的留白节奏。
- 结果页重点顺序：问题定位 → 原因 → 修改建议。
- 只显示后端验证后的 `issues[]`，数量可为 0~5，不得固定展示三个问题。
- bbox 使用相对原图的 0~1 normalized coordinate；不要用与渲染图片尺寸无关的绝对定位。
- 所有按钮必须有真实行为；不要添加假登录、假支付、假导航。

## 测试基线

修改行为前先更新测试并确认旧代码失败，再做最小实现。当前已验证：

- 16 项针对性 Vitest：通过
- 6 项 Playwright E2E：通过
- TypeScript：通过
- 改动文件 ESLint：通过
- `git diff --check`：通过

常用命令：

```powershell
pnpm test -- src/features/ai-pic-detect/review-experience.test.tsx
pnpm typecheck
$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:3000'; pnpm test:e2e
```

## 后续待办

- 等待真实后端 API Contract，仅替换 `analyzeImage` 边界，不改结果 UI 数据契约。
- 继续优化视觉时保持 P0 流程和现有测试通过。
- 真实价格、额度扣减、支付 Provider、账号历史记录属于后续商业化阶段。
- 修改代码前先阅读 `README.md`、`AGENTS.md`、`PROJECT_CONTEXT.md`、`CURRENT_STATE.md`、`DECISIONS.md`、`TASKS.md`、`HANDOFF.md`。

## Git 规则

用户明确要求时才创建备份提交；同一任务连续修改合并为一次。当前恢复点为 `6bc6483`，仅为本地提交，未代表已推送远程。
