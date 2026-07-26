# Engineering Flow 用户指南

[简体中文](user-guide.zh-CN.md) | [English](user-guide.md)

本指南包含完整用法、安装维护、排障和本地验证。产品概览见项目 [README](../README.md)。

## 目录

- [基本用法](#基本用法)
- [选择工作流](#选择工作流)
- [详细场景](#详细场景)
- [安装](#安装)
- [运行机制](#运行机制)
- [更新与卸载](#更新与卸载)
- [常见问题](#常见问题)
- [验证状态与限制](#验证状态与限制)
- [项目开发与基准测试](#项目开发与基准测试)

## 基本用法

### 清晰任务直接描述

安装插件并开启新会话后，可以像平时一样描述任务：

```text
给 formatDisplayName 增加可选 middleName；空白值忽略。保留现有导出，添加最小验证，不要提交。
```

基础工程规则会自动生效。模型应检查项目规则和相关代码、保护无关改动、只询问会实质改变结果的问题，并在完成前运行范围匹配的验证。

### 复杂任务指定工作流

把工作流名称和需求一起发送到对话框，建议放在第一行：

```text
$engineering-flow:develop
实现订单批量导出。复用现有权限和查询能力，添加聚焦测试并同步权威文档。不要提交。
```

调用格式：

| 环境 | 格式 |
|---|---|
| Codex CLI | `$engineering-flow:<workflow>` |
| Claude Code | `/engineering-flow:<workflow>` |

这些 token 应输入到 Codex 或 Claude Code 对话中，不是 Bash 或 PowerShell 命令。

## 选择工作流

| 场景 | 工作流 | 是否修改代码 |
|---|---|---|
| 新功能、重构、补测试、代码完善 | `develop` | 是 |
| 编码前必须确认重大决定 | `develop confirm` | 确认后修改 |
| bug、回归、错误输出、间歇故障、性能下降 | `diagnose` | 用户要求修复时修改 |
| 从 0 出方案或完善已有设计 | `code-design` | 否 |
| 评审 diff、分支或未提交改动 | `review` | 否，严格只读 |
| 换会话或交给其他 agent | `handoff` | 否 |

## 详细场景

### `develop`

`develop` 是完整开发入口，负责：

1. 检查项目规则、权威文档、Git 状态、相关代码、测试和调用方。
2. 对齐目标、验收行为、范围、事实和重要方案决定。
3. 只询问阻塞性问题，从仓库推断可逆的内部实现细节。
4. 实现最小完整改动并获得聚焦反馈。
5. 按实际风险补边界测试，按真实设计压力改善代码结构。
6. 使用新鲜证据验证并同步发生变化的权威文档。

普通模式会直接推进：

```text
$engineering-flow:develop
实现设备告警通知人配置。检查现有设计和代码边界，完成聚焦测试，最后同步权威文档。
```

必须先确认再编码时使用：

```text
$engineering-flow:develop confirm
实现客户批量删除。先确认目标、验收行为、关联数据处理和范围；得到我的明确确认后才能编码。
```

模型应先返回需求摘要、假设和阻塞问题，然后等待确认。

代码完善和极端测试同样由 `develop` 处理：

```text
$engineering-flow:develop
保持公开行为不变，改善通知模块的所有权和可读性；只在真实变化压力下增加抽象，并补充适用的重复、并发和外部失败测试。
```

设计模式和减少代码行数都不是目标。只有当新增抽象确实减少总耦合和维护成本时才采用。

### `diagnose`

`diagnose` 用于已有行为出现问题。它会先固定期望与实际的差异，建立最小可靠复现，沿数据和控制流定位拥有该规则的模块，再验证可证伪的根因假设。

```text
$engineering-flow:diagnose
修复 calculateRenewalDate 在 1 月 31 日增加一个月后进入 3 月的问题。先复现，定位根因，留下能检测该回归的测试。
```

诊断默认只读；用户同时要求修复时才修改代码。存在正确测试缝隙时，应先观察失败再修复。

### `code-design`

`code-design` 用于尚未形成方案的目标，或需要完善的设计草案。

```text
$engineering-flow:code-design
我们要增加多渠道通知，但模块和接口还没确定。结合当前仓库给出最低必要复杂度的方案、权衡、开放问题和实施顺序。不要编码。
```

它默认只返回方案，不实现生产代码，也不会静默修改设计文档。方案确认后，再使用 `develop` 实施。

### `review`

`review` 对 diff、分支、PR 或未提交改动执行严格只读评审。

```text
$engineering-flow:review
依据 docs/access-policy.md 评审当前权限改动。按严重程度报告问题并给出文件和行号，不要修改文件。
```

评审会检查需求、正确性、安全、设计、可读性、测试、文档和范围。发现问题不会自动获得修复权限。

### `handoff`

`handoff` 为新会话或其他 agent 保存最小必要状态。

```text
$engineering-flow:handoff
生成当前任务的续接记录，包含目标、已完成状态、关键文件、决定、最新验证、剩余任务、风险和 Git 状态。
```

未指定输出路径时，交接内容只返回在回复中，不会静默创建文件。

## 安装

### Codex CLI

在系统终端执行：

```bash
codex plugin marketplace add yyqqCoding/engineering-flow-skills
codex plugin add engineering-flow@engineering-flow
```

确认插件已启用：

```bash
codex plugin list --json
```

输出中应包含类似信息：

```json
{
  "pluginId": "engineering-flow@engineering-flow",
  "installed": true,
  "enabled": true
}
```

关闭旧会话，在目标项目中开启新会话：

```bash
cd /path/to/your-project
codex
```

本地开发时可以使用仓库绝对路径：

```bash
codex plugin marketplace add /absolute/path/to/engineering-flow-skills
codex plugin add engineering-flow@engineering-flow
```

### Claude Code

在 Claude Code 对话中执行：

```text
/plugin marketplace add yyqqCoding/engineering-flow-skills
/plugin install engineering-flow@engineering-flow
```

Claude Code 使用 `/engineering-flow:<workflow>`。

## 运行机制

```text
新会话
  └─ 自动加载精简 Engineering Core

普通请求
  └─ 只使用 Core

显式点名工作流
  └─ 仅为当前请求加载完整工作流
```

- 当前用户请求以及项目内 `AGENTS.md`、`CLAUDE.md` 和权威文档始终优先。
- 未点名的完整工作流不会自动加载。
- 未知 token 不会触发工作流。
- 工作流不会自动获得 commit、push、发布、创建 issue、安装依赖或修改全局配置的权限。

设计细节见 [触发模型](trigger-model.md)。

## 更新与卸载

刷新 Codex marketplace：

```bash
codex plugin marketplace upgrade engineering-flow
```

发布版本变化后重新安装，并开启新会话：

```bash
codex plugin remove engineering-flow@engineering-flow
codex plugin add engineering-flow@engineering-flow
```

卸载：

```bash
codex plugin remove engineering-flow@engineering-flow
codex plugin marketplace remove engineering-flow
```

## 常见问题

| 现象 | 处理方式 |
|---|---|
| 终端提示 `$engineering-flow:develop: command not found` | Token 应发送到 Codex 对话，不是系统终端。 |
| 安装后看不出变化 | 确认插件已安装并启用，然后关闭旧会话并重新启动。 |
| 启动时没有欢迎提示 | 正常。Core 在后台加载，不要求显示横幅。 |
| 工作流没有触发 | 使用完整、准确的 token，建议放在请求第一行。 |
| 更新后仍是旧行为 | 刷新 marketplace、重装插件并开启新会话。 |

## 验证状态与限制

- 静态与确定性测试：36/36 通过。
- Codex 当前 cohort：17 个场景，candidate 51/51 通过；显式调用 51/51，误触发、漏触发、碰撞、污染和未授权提交均为 0。
- Claude Code 2.1.197 通过 strict manifest 校验，并完成显式 `/engineering-flow:develop` 实机样本。
- Claude 普通 Core-only 歧义样本尚未达到 Codex 同等行为，因此涉及数据、权限等重大决定时应显式调用完整工作流。
- 完整工作流会增加上下文、工具调用和耗时，所以不会自动加载到每个请求。

完整证据见 [基准日志](benchmark-log.md) 和 [测试策略](testing-strategy.md)。

## 项目开发与基准测试

要求 Node.js 20 或更高版本：

```bash
npm test
```

使用 OpenAI-compatible provider 时，在仓库根目录创建已被 Git 忽略的 `.env`：

```dotenv
BENCH_MODEL_PROVIDER=benchmark_env
BENCH_BASE_URL=https://your-provider.example/v1
BENCH_API_KEY=replace-me
BENCH_MODEL=your-model
BENCH_REASONING_EFFORT=low
```

Shell 环境变量优先于 `.env`。不要提交真实 API Key。

```bash
# 单个隔离样本
node scripts/run-codex-benchmark.js readability-trap candidate

# 重复 A/B 样本
BENCH_REPETITIONS=3 BENCH_CONCURRENCY=2 \
  npm run benchmark:ab -- readability-trap ambiguous-delete

# 补齐当前 cohort 并汇总
BENCH_TARGET_COMPLETED=3 BENCH_CONCURRENCY=2 npm run benchmark:fill
npm run benchmark:summary
```

Runner 会隔离全局 plugins 和 skills，并使用 fixture/candidate 指纹避免混合不同版本的结果。原始结果保存在已忽略的 `benchmark-results/` 中。
