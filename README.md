# Engineering Flow Skills

[简体中文](README.md) | [English](README.en.md)

面向 Codex CLI 和 Claude Code 的轻量、证据驱动开发流程。

本项目融合了 Superpowers、Matt Pocock 的 engineering skills 与 Ponytail 中经过验证的思想，同时避免把所有任务强制塞进需求访谈、计划文件、工作树、子代理、TDD、评审和分支收尾等固定仪式。目标不是让模型“做更多步骤”，而是让它在需要时更可靠，在简单任务上保持直接。

## 🚀 30 秒理解：到底怎么用？

你只需要记住两种用法。

### 先分清两个输入位置

| 在哪里输入？ | 用来做什么？ | 示例 |
|---|---|---|
| 🖥️ 系统终端（Bash、PowerShell 等） | 安装插件、进入项目、启动 Codex | `codex plugin add ...`、`cd ...`、`codex` |
| 💬 Codex 对话输入框 | 描述开发需求、调用 workflow | `实现用户筛选功能`、`$engineering-flow:develop` |

一句话记忆：**安装命令在终端执行；需求和 `$engineering-flow:...` 在 Codex 对话框输入。**

### 用法 A：普通任务，直接说需求

先在终端进入你的项目并启动 Codex：

```bash
cd /path/to/your-project
codex
```

然后在 **Codex 对话输入框**中正常描述需求：

```text
给 formatDisplayName 增加可选 middleName；空白 middleName 忽略。
保留现有导出，添加聚焦测试，不要提交。
```

安装插件并开启新会话后，你什么 skill 都不用写。Engineering Core 会自动生效，检查仓库状态、`AGENTS.md`、相关文档、现有代码和测试。

### 用法 B：希望模型执行完整流程，在第一行写 workflow token

仍然是在 **Codex 对话输入框**中输入：

```text
$engineering-flow:develop
实现订单批量导出。先理解现有设计和需求，完成代码、聚焦测试，并同步权威文档。不要提交。
```

`$engineering-flow:develop` 会为当前这次请求加载完整开发 workflow。

> ⚠️ `$engineering-flow:develop` 不是 Bash 命令，不要单独粘贴到终端执行。它应该和你的需求一起输入到 Codex 对话框中。

### 最重要的原则

- ✅ 清晰的小任务：直接说需求，不写任何 token。
- ✅ 完整功能开发：使用 `$engineering-flow:develop`。
- ✅ 必须先确认需求才能编码：使用 `$engineering-flow:develop confirm`。
- ✅ 已存在的 bug 或回归：使用 `$engineering-flow:diagnose`。
- ❌ 不要每个任务都依次调用 `clarify → develop → verify`。
- ❌ 不要为了“更规范”而把简单修改变成复杂仪式。

## 📦 3 分钟完成安装和第一次使用

### 第 1 步：在终端安装插件，只需要执行一次

```bash
codex plugin marketplace add yyqqCoding/engineering-flow-skills
codex plugin add engineering-flow@engineering-flow
```

不需要手动克隆仓库，也不需要运行 `npm install`。这是当前电脑上的 Codex 用户级安装，不必在每个项目中重复安装。

### 第 2 步：确认插件已经启用

```bash
codex plugin list --json
```

输出中应该能看到类似内容：

```json
{
  "pluginId": "engineering-flow@engineering-flow",
  "installed": true,
  "enabled": true
}
```

### 第 3 步：关闭旧会话，在你的项目目录启动新会话

```bash
cd /path/to/your-project
codex
```

必须开启新会话，SessionStart 才会加载自动 Core。

### 第 4 步：在 Codex 对话框中发送第一次请求

最简单的测试：

```text
检查当前仓库状态和项目规则，告诉我这个项目应该如何运行最小验证。只分析，不修改文件。
```

或者测试完整 workflow：

```text
$engineering-flow:review
只读评审当前未提交改动，按严重程度报告问题并提供文件和行号。不要修改任何文件。
```

🎉 到这里就可以正常使用了。以后切换到其他项目，只需要在该项目目录执行 `codex`，然后直接描述需求或显式调用 workflow。

### 安装后到底会自动做什么？

- 🟢 每次开启新的 Codex 会话：自动加载精简的 Engineering Core，无需输入 token。
- 🟡 每次发送请求：如果第一行有 `$engineering-flow:...`，为这一次请求加载对应的完整 workflow。
- ⚪ 普通请求没有 token：只使用精简 Core，不会自动猜测并加载完整 workflow。
- 🔒 项目自己的 `AGENTS.md`、权威文档和你的当前要求始终优先。

## 🛟 遇到问题先看这里

| 现象 | 原因和处理方式 |
|---|---|
| 终端提示 `$engineering-flow:develop: command not found` | 输入位置错了。`$engineering-flow:...` 应该发到 Codex 对话框，不是系统终端。 |
| 安装后看不出变化 | 先运行 `codex plugin list --json` 确认 `installed` 和 `enabled` 都是 `true`，然后关闭旧会话并重新运行 `codex`。 |
| 启动时没有欢迎提示 | 正常。Core 在后台注入，不要求显示额外横幅；可使用上面的只读 `review` 示例验证显式 workflow。 |
| workflow 没有触发 | 使用完整、准确的 token，例如 `$engineering-flow:diagnose`；建议放在请求第一行，并确认插件处于启用状态。 |
| 在 Claude Code 中使用 | 普通需求仍直接输入；workflow 前缀改成 `/engineering-flow:`。安装也使用 Claude Code 内的 `/plugin ...` 命令，不能照抄 Codex 的 `$` 前缀。 |
| 更新后仍是旧行为 | 先按[更新](#-更新)步骤刷新并重装插件，再开启新会话。 |

## 🧭 我现在应该选哪个？

| 你的情况 | 应该输入什么 | 会不会编码？ |
|---|---|---|
| 需求清晰，只是一个小改动 | 直接描述需求，不写 token | 会直接实现 |
| 要完成一个完整功能 | `$engineering-flow:develop` + 需求 | 会；只询问阻塞问题 |
| 任何编码前都必须由你确认 | `$engineering-flow:develop confirm` + 需求 | 不会立即编码；先总结并等待确认 |
| 只想把需求讨论清楚 | `$engineering-flow:clarify` + 需求 | 不会编码 |
| 已有 bug、回归、错误输出或性能下降 | `$engineering-flow:diagnose` + 问题 | 用户要求修复时会编码；先复现和定位根因 |
| 代码边界、状态或抽象设计很复杂 | `$engineering-flow:code-design` + 设计问题 | 按请求决定分析或实现 |
| 只想评审当前改动 | `$engineering-flow:review` + 评审范围 | 不会编码，也不会修改文件 |
| 功能基本完成，需要核对测试和文档 | `$engineering-flow:verify-and-reconcile` + 验收范围 | 只修正请求范围内发现的问题 |
| 今天做不完，需要下次继续 | `$engineering-flow:handoff` + 当前任务 | 不会继续开发，只生成交接记录 |

## 💬 三个最常用的完整示例

### 示例 1：清晰的小需求，不调用 skill

```text
用户列表增加“状态”筛选。复用现有查询参数和下拉组件，保持当前接口风格，添加最小验证，不要提交。
```

预期行为：模型检查现有实现后直接开发；只有真正影响接口或业务口径的细节不明确时才提问。

### 示例 2：必须确认需求后才能编码

```text
$engineering-flow:develop confirm
实现客户批量删除。

确保你理解所有需求细节，不确认的细节向我提问；确认无误后，才能编码。
```

预期行为：模型先返回目标、验收行为、范围、假设和阻塞问题，然后停止并等待你的确认。你回复“确认，可以编码”后才继续。

### 示例 3：修复一个回归问题

```text
$engineering-flow:diagnose
修复 calculateRenewalDate 在 1 月 31 日增加一个月后进入 3 月的问题。
先复现问题，找到正确所有权，留下能够检测该回归的测试，然后运行聚焦验证。不要提交。
```

预期行为：模型先观察问题或失败测试，再修复根因，而不是只在表面调用点打补丁。

## 📊 当前状态

- Codex CLI 已完成 15 场景 A/B 行为验证。
- Candidate 最终工程评分 47/47，通过显式路由测试 19/19，误触发为 0。
- Claude Code 插件元数据和 hooks 已通过静态兼容测试。
- 当前环境没有安装 Claude Code，因此尚未完成 Claude Code 实机行为验证。

当前版本适合作为 Codex CLI 的个人开发流程使用；跨平台发布结论仍需补充 Claude Code 实机验证。

## 🧠 核心设计

- 只有 228 词的 Engineering Core 始终自动生效。
- 完整 workflows 只能通过用户显式 token 加载，不进行模型自动猜测。
- 回归或高风险业务行为在存在稳定测试缝隙时优先观察失败；普通配置、展示和机械变更不强制仪式化单测。
- 优先写熟悉、显式、局部可理解、可调试的代码，而不是追求最少行数。
- 只复用语义相同且应该共同演进的逻辑，避免为了消除表面重复制造错误抽象。
- 完成前使用新鲜、范围匹配的证据验证，并同步权威文档；只有长期规则才进入 `AGENTS.md` 或 `CLAUDE.md`。

相关设计文档：

- [产品设计](docs/product-design.md)
- [行为规范](docs/behavior-spec.md)
- [触发模型](docs/trigger-model.md)
- [测试策略](docs/testing-strategy.md)
- [A/B 基准记录](docs/benchmark-log.md)

## ⚙️ 工作方式

普通请求只接收精简 Core：

```text
普通用户请求
    └─ Engineering Core
       ├─ 检查仓库状态、项目规则、相关代码和测试
       ├─ 只询问会实质改变结果的不确定项
       ├─ 选择正确的所有权与复用边界
       ├─ 编写清晰、可维护的代码
       └─ 运行范围匹配的验证并同步文档
```

只有显式 token 才加载完整 workflow：

```text
$engineering-flow:diagnose ...
    └─ UserPromptSubmit hook
       └─ 注入完整 diagnose/SKILL.md，仅作用于当前 turn
```

Codex 和 Claude 使用同一个确定性路由 hook；普通请求、未知 token 和未显式点名的 skills 不会加载完整 workflow。

## 🖥️ 支持环境

- Codex CLI
- Claude Code

其他 agent hosts 暂不在支持范围内。

## 📦 详细安装说明

### Codex CLI

```bash
codex plugin marketplace add yyqqCoding/engineering-flow-skills
codex plugin add engineering-flow@engineering-flow
```

安装后开启一个新会话，使 SessionStart Core 生效。

本地开发时，可把 `yyqqCoding/engineering-flow-skills` 替换为仓库绝对路径：

```bash
codex plugin marketplace add /absolute/path/to/engineering-flow-skills
codex plugin add engineering-flow@engineering-flow
```

### Claude Code

在 Claude Code 中执行：

```text
/plugin marketplace add yyqqCoding/engineering-flow-skills
/plugin install engineering-flow@engineering-flow
```

Claude Code 文件结构和 hook 输出已通过静态测试，但上述安装和行为尚未在当前电脑上完成实机验证。

## 🧰 Workflows 详细说明

| Workflow | 适用场景 | Codex 调用示例 |
|---|---|---|
| `develop` | 从需求对齐到实现、验证和文档归纳的完整开发任务 | `$engineering-flow:develop 实现订单批量导出。` |
| `clarify` | 需求存在多个会实质改变产品结果的分支，暂不编码 | `$engineering-flow:clarify 梳理客户删除规则，不要编码。` |
| `diagnose` | 已有行为出现 bug、回归、错误输出、间歇故障或性能下降 | `$engineering-flow:diagnose 修复月底续费日期跳到下个月的问题。` |
| `code-design` | 存在非局部模块边界、状态、依赖、变化轴或抽象压力 | `$engineering-flow:code-design 评估通知渠道扩展的设计边界。` |
| `review` | 对当前 diff、分支或未提交改动进行严格只读评审 | `$engineering-flow:review 只读评审当前权限改动。` |
| `verify-and-reconcile` | 复杂需求完成后的验收证据、权威文档和长期规则核对 | `$engineering-flow:verify-and-reconcile 核对实现、测试和设计文档。` |
| `handoff` | 工作需要跨会话继续，生成紧凑且可验证的交接记录 | `$engineering-flow:handoff 生成当前任务的续接记录。` |

Claude Code 中把 `$engineering-flow:` 替换为 `/engineering-flow:`。

### 1. 完整开发

```text
$engineering-flow:develop
实现设备告警通知人配置：先检查现有设计文档和代码边界，完成聚焦测试，最后同步权威文档。不要提交。
```

默认模式只询问阻塞性问题，其余可从仓库安全推断的实现细节由模型自主决定。

如果你要求“确认无误后才能编码”，使用 confirm 模式：

```text
$engineering-flow:develop confirm
实现客户批量删除。确保理解所有需求细节，不确认的细节向我提问；确认无误后才能编码。
```

模型应先输出目标、验收行为、范围、假设和阻塞问题，并等待明确确认。

### 2. 只做需求澄清

```text
$engineering-flow:clarify
梳理客户存在历史订单时的删除、停用、数据保留和权限规则。只形成可执行需求说明，不要编码。
```

适合 Web 端讨论结果尚未完全转化为实现口径的阶段。

### 3. 诊断回归

```text
$engineering-flow:diagnose
修复 calculateRenewalDate 在 1 月 31 日增加一个月后进入 3 月的问题。先复现，再修复并留下敏感回归测试。
```

该 workflow 会区分症状和根因，检查相关调用方，并在存在正确测试缝隙时先观察失败。

### 4. 设计与可维护性

```text
$engineering-flow:code-design
通知渠道的校验、payload 和 transport 选择在多个位置重复分支。评估是否存在真实变化轴，并实现最低必要复杂度的边界。
```

设计模式不是目标。只有当它减少的耦合和变更成本大于新增接口、文件和间接层时才采用。

### 5. 只读评审

```text
$engineering-flow:review
依据 docs/access-policy.md 评审当前未提交权限改动。只报告重要问题并提供文件和行号，不要修改工作区。
```

评审反馈本身不需要独立 workflow。Core 会先把 reviewer comment 当作技术主张验证，再决定接受、部分接受或用证据反驳。

### 6. 完成核对

```text
$engineering-flow:verify-and-reconcile
重新核对本次需求的验收行为、实现、测试结果、权威设计文档和 AGENTS.md；不要为了迁就实现而改写已确认需求。
```

适合多验收项、权限/数据风险、迁移、权威文档变化或需要长期项目规则的任务。简单局部任务通常不需要显式调用。

### 7. 跨会话交接

```text
$engineering-flow:handoff
生成当前工作的续接记录，包含目标、已完成状态、关键文件、最新验证、剩余任务、风险和 Git 状态。
```

未指定输出路径时只在回复中返回交接内容，不会静默创建文件。

## 🗺️ 推荐开发流程

```text
需求说明
  → 必要时 clarify
  → develop 或直接实现清晰任务
  → 回归问题使用 diagnose
  → 真实设计压力使用 code-design
  → 聚焦测试或最小有效验证
  → 必要时 verify-and-reconcile
  → 更新权威 docs
  → 仅把长期规则写入 AGENTS.md / CLAUDE.md
```

这不是必须逐项执行的流水线。简单任务应保持简单，只有任务风险和复杂度需要时才升级流程。

## 🤝 与项目规则协作

- 当前用户请求和项目内 `AGENTS.md`、`CLAUDE.md` 优先于本插件。
- 业务口径、接口、SQL、字段和验收标准应继续放在项目自己的权威文档中。
- 本插件不会强制项目采用新的文档目录、分支策略、提交格式或设计模式。
- 未经用户授权，不会因为 workflow 自动获得 commit、push、发布、创建 issue、安装依赖或修改全局配置的权限。

## 🔄 更新

刷新 Codex marketplace 快照：

```bash
codex plugin marketplace upgrade engineering-flow
```

发布版本发生变化后，重新安装插件：

```bash
codex plugin remove engineering-flow@engineering-flow
codex plugin add engineering-flow@engineering-flow
```

更新后开启新会话。

## 🗑️ 卸载

```bash
codex plugin remove engineering-flow@engineering-flow
codex plugin marketplace remove engineering-flow
```

## 🧪 开发与测试

要求 Node.js 20 或更高版本：

```bash
npm test
```

运行一个隔离 Codex 行为样本：

```bash
BENCH_REASONING_EFFORT=low \
  node scripts/run-codex-benchmark.js readability-trap candidate
```

运行重复 A/B 样本：

```bash
BENCH_REPETITIONS=3 BENCH_CONCURRENCY=2 \
  npm run benchmark:ab -- readability-trap ambiguous-delete
```

只运行一个 arm：

```bash
BENCH_ARMS=baseline npm run benchmark:ab -- regression-sensitivity
BENCH_ARMS=candidate npm run benchmark:ab -- regression-sensitivity
```

汇总结果：

```bash
npm run benchmark:summary
npm run benchmark:summary -- false-deduplication
```

原始结果保存在已忽略的 `benchmark-results/` 中。Runner 会隔离全局 plugins 和 skills，并记录 fixture/candidate 指纹，避免不同版本的样本被混合统计。

## ⚠️ 已知限制

- Claude Code 真实安装与行为尚未在当前开发环境验证。
- 当前基准使用强模型；Candidate 的主要收益是稳定关键流程边界，而不是让所有任务获得更高正确率。
- 完整 workflow 会增加上下文、工具调用和耗时，因此保持显式调用。
- 当前版本为 `0.1.0`，未来 workflow 名称和细节仍可能在新证据下调整。

## 🙏 致谢与许可

本项目参考并重新组织了以下项目中的部分思想：

- [Superpowers](https://github.com/obra/superpowers)
- [Matt Pocock Skills](https://github.com/mattpocock/skills)
- [Ponytail](https://github.com/DietrichGebert/ponytail)

具体归属见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。项目采用 [MIT License](LICENSE)。
