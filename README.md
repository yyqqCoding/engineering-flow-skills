# Engineering Flow Skills

[简体中文](README.md) | [English](README.en.md)

面向 Codex CLI 和 Claude Code 的轻量、证据驱动开发工作流。

经过精简后，项目只保留 5 个用户可见 workflow：`develop`、`diagnose`、`code-design`、`review` 和 `handoff`。需求澄清、完成核对、边界测试和代码完善不再要求单独调用，而是在真正需要时由相关 workflow 内部完成。

> 日常小任务直接描述；复杂任务显式选择一个 workflow。

## 先看技能：5 个 workflow 分别做什么？

| Workflow | 适用场景 | 结果 | 是否修改代码 |
|---|---|---|---|
| `develop` | 新功能、重构、补测试、代码完善 | 完成实现、验证并同步必要文档 | 是 |
| `diagnose` | bug、回归、错误输出、间歇故障、性能下降 | 复现问题、定位根因；用户要求时修复 | 视请求而定 |
| `code-design` | 从 0 出方案，或完善已有设计 | 产出可实施的设计方案 | 否 |
| `review` | 评审 diff、分支或未提交改动 | 按影响报告有证据的问题 | 否，严格只读 |
| `handoff` | 任务需要换会话或交给其他 agent | 生成紧凑、可继续执行的交接记录 | 否 |

Codex 使用 `$engineering-flow:<workflow>`；Claude Code 使用 `/engineering-flow:<workflow>`。

### 1. `develop`：主要开发入口

适合：

- 实现新功能或完成一个较完整的改动。
- 重构、补测试或保持行为不变地改善现有代码。
- 需要先搞清楚仓库事实、需求细节和方案边界，再开始编码。
- 希望在完成前做聚焦验证、必要的边界强化和文档对账。

`develop` 会完成一条完整但不过度仪式化的开发链路：

1. 检查项目规则、权威文档、Git 状态、相关代码、测试和调用方。
2. 对齐目标、验收行为、范围、事实和会实质改变结果的方案决定。
3. 只询问阻塞性问题；可从仓库安全推断的内部细节由模型自主决定。
4. 实现最小完整改动，并使用有意义的测试、编译、lint 或集成检查获得反馈。
5. 仅在存在适用风险时补边界测试，仅在存在真实设计压力时完善代码结构。
6. 使用当前状态的新鲜证据验证结果，并同步发生变化的权威文档。

普通模式会直接推进：

```text
$engineering-flow:develop
实现订单批量导出。复用现有权限与查询能力，添加聚焦测试并同步权威文档。不要提交。
```

如果任何编码都必须先由你确认，使用 `confirm`：

```text
$engineering-flow:develop confirm
实现客户批量删除。先确认目标、验收行为、数据处理策略和范围；得到我的明确确认后才能编码。
```

此时模型应先返回需求摘要、假设和阻塞问题，然后等待确认。

代码完善和极端测试也使用 `develop`，不需要额外 skill：

```text
$engineering-flow:develop
保持公开行为不变，改善通知模块的所有权和可读性；只在真实变化压力下增加抽象，并补充适用的重复、并发和外部失败边界测试。
```

设计模式不是目标，减少代码行数也不是目标。只有当抽象减少的耦合和变更成本大于新增接口、文件和间接层时才采用。

### 2. `diagnose`：诊断和修复已有问题

适合已有行为出现 bug、回归、错误结果、间歇故障或可测量的性能下降。

它会先固定“期望与实际”的差异，建立尽可能小且可靠的复现信号，沿数据和控制流定位真正拥有该规则的模块，再验证可证伪的根因假设。诊断默认只读；只有用户同时要求修复时才会改代码。

```text
$engineering-flow:diagnose
修复 calculateRenewalDate 在 1 月 31 日增加一个月后进入 3 月的问题。先复现，定位根因，留下能检测该回归的测试并运行聚焦验证。不要提交。
```

存在正确测试缝隙时，它会先观察失败再修复；边界测试和结构改善只围绕已证实的根因展开，不把局部 bug 扩大成全面重构。

### 3. `code-design`：从 0 出方案或完善方案

适合两类任务：

- 只有目标或问题，还没有确定模块、接口和实施方案。
- 已有设计草案，但需要检查完整性、一致性、可行性、所有权和不必要复杂度。

```text
$engineering-flow:code-design
我们要增加多渠道通知，但模块和接口还没确定。结合当前仓库给出最低必要复杂度的方案、权衡、开放问题、验收证据和实施顺序。不要编码。
```

`code-design` 默认只产出方案，不实现生产代码，也不会静默修改设计文档。方案确认后，再发起新的 `develop` 请求实施。

### 4. `review`：严格只读评审

适合评审当前 diff、分支、PR 或未提交工作。它会先确定比较基准并恢复需求意图，再分别检查需求、正确性、安全、设计、可读性、测试、文档和范围。

```text
$engineering-flow:review
依据 docs/access-policy.md 评审当前未提交的权限改动。按严重程度报告问题并给出文件和行号，不要修改任何文件。
```

没有重要问题时会明确说明，同时报告仍未验证的范围。它不会因为发现问题而自动进入修复。

### 5. `handoff`：跨会话交接

适合当前上下文过长、需要开启新会话，或把任务交给其他 agent 的情况。

```text
$engineering-flow:handoff
生成当前任务的续接记录，包含目标、已完成状态、关键文件、决定及原因、最新验证、剩余任务、风险和 Git 状态。
```

未指定输出路径时，交接内容只会返回在回复中，不会静默创建文件。

## 我现在应该怎么选？

| 你的情况 | 推荐用法 |
|---|---|
| 清晰、局部、低风险的小改动 | 直接描述需求，不写 workflow token |
| 新功能、重构、补测试或代码完善 | `develop` |
| 编码前必须由你确认所有重大决定 | `develop confirm` |
| 已有行为出错，需要复现和根因定位 | `diagnose` |
| 尚未形成方案，或已有方案需要完善 | `code-design` |
| 只想评审，不允许改文件 | `review` |
| 要换会话继续 | `handoff` |

最常见的选择可以概括为：

```text
清晰小任务                         → 直接说需求
完整开发                           → develop
已有行为出错                       → diagnose
没想好怎么做 / 需要完善设计         → code-design
```

`review` 和 `handoff` 在需要正式评审或换会话时单独使用。它们不是每次开发的必经步骤。

## 如何调用？

### 用法 A：普通任务直接说

安装插件并开启新会话后，精简的 Engineering Core 会自动生效。对于清晰的小任务，不需要写任何 workflow：

```text
给 formatDisplayName 增加可选 middleName；空白 middleName 忽略。保留现有导出，添加最小验证，不要提交。
```

Core 会要求模型检查项目规则和相关实现、保护无关改动、只询问实质性歧义、选择正确所有权、编写可维护代码并运行范围匹配的验证。

### 用法 B：复杂任务显式调用

把 workflow token 和任务一起发送到模型的对话输入框，建议放在第一行：

| 环境 | 调用格式 | 示例 |
|---|---|---|
| Codex CLI | `$engineering-flow:<workflow>` | `$engineering-flow:develop` |
| Claude Code | `/engineering-flow:<workflow>` | `/engineering-flow:develop` |

> Workflow token 不是 Bash 或 PowerShell 命令。安装命令在系统终端执行；需求和 workflow token 在 Codex 或 Claude Code 的对话中输入。

完整 workflow 只在用户明确点名时加载，普通请求不会由模型猜测并自动选择一个完整 workflow。

## 精简后少了什么？

不是能力被删除，而是减少了需要用户记忆和手动串联的步骤：

| 以前可能独立存在的能力 | 现在由谁负责 |
|---|---|
| 需求澄清和事实确认 | `develop`、`diagnose`、`code-design` 内部的对齐阶段 |
| 完成验证和需求对账 | `develop`、`diagnose` 的完成阶段 |
| 极端和边界测试 | `develop`、`diagnose` 中按风险启用的条件强化 |
| 代码完善、架构和设计模式 | `develop`、`diagnose` 中按设计压力启用；纯方案任务使用 `code-design` |
| 评审意见核验 | 自动 Core 的常驻规则 |

因此不需要依次调用“澄清 → 开发 → 极端测试 → 代码优化 → 验证”。通常一个 `develop` 就能完成整个开发任务。

## 安装

### Codex CLI

在系统终端执行一次：

```bash
codex plugin marketplace add yyqqCoding/engineering-flow-skills
codex plugin add engineering-flow@engineering-flow
```

确认插件已经启用：

```bash
codex plugin list --json
```

输出中应能看到类似信息：

```json
{
  "pluginId": "engineering-flow@engineering-flow",
  "installed": true,
  "enabled": true
}
```

然后关闭旧会话，在目标项目目录开启新会话：

```bash
cd /path/to/your-project
codex
```

新会话会加载自动 Core。以后切换项目时，只需在对应项目目录启动 Codex。

本地开发安装可把 GitHub 地址换成仓库绝对路径：

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

Claude Code 使用 `/engineering-flow:<workflow>`。当前实机证据支持显式 `/engineering-flow:develop`；涉及数据策略、权限或其他重大决定时，建议显式调用完整 workflow，不要只依赖普通 Core。

## 安装后如何工作？

```text
新会话
  └─ 自动加载 243 词 Engineering Core

普通请求
  └─ 只使用 Core，保持轻量

显式 $engineering-flow:develop 或 /engineering-flow:develop
  └─ 仅为当前请求加载完整 develop workflow
```

- 项目自己的 `AGENTS.md`、`CLAUDE.md`、权威文档和当前用户要求始终优先。
- 所有 5 个完整 workflow 在 Codex 和 Claude Code 上都保持用户显式调用。
- 未知 token、普通请求和未点名的 workflow 不会触发完整 skill。
- Workflow 不会自动获得 commit、push、发布、创建 issue、安装依赖或修改全局配置的权限。

## 更新与卸载

更新 Codex marketplace 快照：

```bash
codex plugin marketplace upgrade engineering-flow
```

发布版本变化后，重新安装并开启新会话：

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
| 终端提示 `$engineering-flow:develop: command not found` | 输入位置错了。Workflow token 应发送到 Codex 对话，不是系统终端。 |
| 安装后看不出变化 | 确认插件 `installed` 和 `enabled` 都为 `true`，然后关闭旧会话并重新启动。 |
| 启动时没有欢迎提示 | 正常。Core 在后台注入，不要求显示横幅。 |
| Workflow 没有触发 | 使用完整、准确的 token，建议放在请求第一行，并确认插件已启用。 |
| 更新后仍是旧行为 | 刷新 marketplace、重装插件并开启新会话。 |

## 设计原则

- 目标是最低必要复杂度，不是最少代码行数。
- 优先熟悉、显式、局部可理解、可调试的代码。
- 只复用语义相同且应该共同演进的行为，避免因表面重复制造错误抽象。
- 回归或高风险业务行为在存在稳定测试缝隙时优先观察失败；配置、展示和机械改动不强制仪式化单测。
- 边界强化基于真实输入、状态、并发、权限、资源、迁移或兼容性风险，不凭空发明产品行为。
- 设计模式只用于解决已经观察到的变化压力，不是代码质量评分项。
- 完成前使用新鲜、范围匹配的证据验证，并只同步真正变化的权威事实。

项目不会强制采用新的文档目录、分支策略、提交格式、工作树、子代理或设计模式。

## 验证状态

- 五工作流架构通过 36/36 静态与确定性测试。
- Codex 当前 cohort 覆盖 17 个场景、每个 arm 3 个隔离样本：baseline 45/51（88.2%），candidate 51/51（100%）。
- Candidate 显式调用检查为 51/51；误触发、漏触发、workflow 碰撞、污染和未授权提交均为 0。
- 已证实的增益集中在两个稳定差异：未定义关联数据删除策略时先等待，以及回归修复先观察失败再转绿。
- Claude Code 2.1.197 通过官方 strict manifest 验证，能够加载插件、5 个 workflow 和 hooks；显式 `/engineering-flow:develop` 歧义样本通过且工作区零改动。
- Claude 的普通 Core-only 同类样本仍会自行选择 `RESTRICT` 并编码，因此当前不声明其与 Codex 具有完全相同的普通提示可靠性。

完整记录见 [A/B 基准日志](docs/benchmark-log.md)。

## 开发与测试

要求 Node.js 20 或更高版本：

```bash
npm test
```

使用其他 OpenAI-compatible provider 时，在仓库根目录创建不会被 Git 跟踪的 `.env`：

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

# 按当前 fingerprint 补齐缺失样本并汇总
BENCH_TARGET_COMPLETED=3 BENCH_CONCURRENCY=2 npm run benchmark:fill
npm run benchmark:summary
```

Runner 会隔离全局 plugins 和 skills，并使用 fixture/candidate 指纹避免混合不同版本的结果。原始输出保存在已忽略的 `benchmark-results/` 中。

## 设计与测试文档

- [产品设计](docs/product-design.md)
- [行为规范](docs/behavior-spec.md)
- [触发模型](docs/trigger-model.md)
- [测试策略](docs/testing-strategy.md)
- [A/B 基准日志](docs/benchmark-log.md)

## 已知限制

- Claude Code 的显式 `develop` 路径已实机通过，但普通 Core-only 歧义样本未通过；尚不能声明与 Codex 完全等价的跨平台行为。
- Claude 验证使用 session-only `--plugin-dir`，本轮未修改用户全局 Claude marketplace 安装。
- 完整 workflow 会增加上下文、工具调用和耗时，因此保持显式调用。
- 当前版本为 `0.1.0`，workflow 名称和细节仍可能在新证据支持下调整。

## 致谢与许可

本项目参考并重新组织了以下项目中的部分思想：

- [Superpowers](https://github.com/obra/superpowers)
- [Matt Pocock Skills](https://github.com/mattpocock/skills)
- [Ponytail](https://github.com/DietrichGebert/ponytail)

具体归属见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。项目采用 [MIT License](LICENSE)。
