# AIpic Detect — Agent Handoff

> Historical note: this file records the pre-implementation recovery audit
> from 2026-09-07. The active source of truth for the P0 front end is now
> `HANDOFF.md`, together with `PROJECT_CONTEXT.md`, `CURRENT_STATE.md`,
> `DECISIONS.md`, and `TASKS.md`.

## 交接目的

将当前项目状态和未完成工作交给下一位 Agent。本文档只记录事实、约束和建议，不代表已经完成任何代码修改。

## 当前项目状态

- 项目路径：`E:\codeproduct\aipic-detect`
- 技术背景：Next.js、React、TypeScript 的图像识别产品
- Git 客户端：`git version 2.55.0.windows.3`
- 当前分支：`main`
- Git 仓库确认：`git rev-parse --is-inside-work-tree` 返回 `true`
- 远程关系：`main...origin/main`
- 当前未显示领先或落后远程分支
- 工作区中的项目文件目前几乎全部显示为未跟踪（`??`），说明可能尚未完成首次提交，或 Git 索引与现有工作区尚未建立对应关系

## 已观察到的未跟踪内容

包括但不限于：

- `.claude/`
- `.codex/`
- `.dev.vars`
- `.env.example`
- `.github/`
- `AGENTS.md`
- `CLAUDE.md`
- `README.md`
- `src/`
- `tests/`
- `e2e/`
- `package.json`
- `pnpm-lock.yaml`
- `vitest.config.ts`
- `playwright.config.ts`

注意：`.dev.vars` 可能包含敏感配置，` .pnpm-store/` 通常不应提交。禁止直接执行 `git add .`，必须先检查 `.gitignore`、敏感文件和首次提交范围。

## 当前核心阻塞

Codex 内置命令执行工具反复失败，错误为：

```text
helper_unknown_error: setup refresh had errors
```

失败发生在命令启动前。已尝试：

- PowerShell 命令
- `cmd` shell
- 明确指定工作目录
- 最小命令和 Git 命令
- 重启/重新打开后的再次尝试

用户本地 PowerShell 可以正常执行 Git 命令，因此问题更可能是 Codex 的命令执行辅助进程、任务工作区绑定或本地客户端环境，而不是项目、Git 或路径问题。

## 用户明确要求

用户希望：

1. 先了解项目基本结构。
2. 在 AI 每次读取的记忆文件和 README 中定义项目工作规范。
3. 每次新需求都采用测试先行（先写失败测试，再改生产代码）。
4. 建立完整自动化测试架构，最大程度减少 AI 引入错误。
5. 当前阶段用户要求先不要修改，先解决读取/执行问题。

## 项目工程约束（来自现有 AGENTS.md）

- 这是生产级图像识别产品。
- 优先级：可靠性、隐私、确定性行为、清晰错误处理。
- 测试工具：Vitest、Testing Library、Playwright。
- 需要运行 `pnpm verify`；涉及用户流程、路由、上传或集成边界时运行 `pnpm test:e2e`。
- 行为变更必须测试先行，并覆盖错误、边界、安全和回归场景。
- 不得泄露上传图片、提示词、密钥、个人数据或供应商响应。
- 不得在不了解现有文件的情况下覆盖 README、配置或测试架构。

## 下一位 Agent 的启动步骤

### 第一阶段：只读恢复检查

先执行：

```powershell
Get-Location
Get-ChildItem -Force
git status --short --branch
rg --files -g '!node_modules' -g '!.next' -g '!dist'
```

然后读取：

- `AGENTS.md`
- `README.md`
- `package.json`
- `pnpm-workspace.yaml`
- `tsconfig.json`
- `vitest.config.ts`
- `playwright.config.ts`
- `.gitignore`
- `src/`、`tests/`、`e2e/` 的目录结构

### 第二阶段：不要立即修改

先输出项目结构、现有脚本、测试缺口和 Git 风险清单。特别确认：

- 为什么全部文件被 Git 识别为未跟踪
- `.gitignore` 是否生效
- `.dev.vars` 是否包含秘密
- 当前是否已经存在可运行的测试脚本
- `pnpm verify` 是否存在并能运行

### 第三阶段：获得用户确认后再改动

只有在用户确认检查结果后，才进行：

- 更新 `AGENTS.md` 和 `README.md`
- 补齐测试配置与基础测试目录
- 增加统一验证脚本
- 逐步建立上传、输入校验、识别服务、异常和隐私边界的测试

每个行为变更必须遵循：红（失败测试）→ 绿（最小实现）→ 重构 → 窄测 → `pnpm verify` → 必要时 `pnpm test:e2e`。

## 当前未执行的事项

- 没有修改任何项目代码。
- 没有修改 README 或记忆文件。
- 没有执行 `git add`、`git commit`、`git reset` 或其他 Git 写操作。
- 没有运行项目测试、构建或验证脚本。
- 没有确认完整目录结构，因为 Codex 命令执行助手当前不可用。

## 交接结论

优先解决 Agent 的读取/执行环境问题；恢复后先做只读审计，再根据用户确认实施文档和自动化测试架构。不得把未读取的文件结构、测试结果或 Git 状态推测成事实。
