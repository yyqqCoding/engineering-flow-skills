# Engineering Flow Skills

[简体中文](README.md) | [English](README.en.md)

面向 Codex CLI 和 Claude Code 的轻量、证据驱动开发流程。

本项目融合了 Superpowers、Matt Pocock 的 engineering skills 与 Ponytail 中经过验证的思想，同时避免把所有任务强制塞进需求访谈、计划文件、工作树、子代理、TDD、评审和分支收尾等固定仪式。目标不是让模型“做更多步骤”，而是让它在需要时更可靠，在简单任务上保持直接。

## 当前状态

- Codex CLI 已完成 15 场景 A/B 行为验证。
- Candidate 最终工程评分 47/47，通过显式路由测试 19/19，误触发为 0。
- Claude Code 插件元数据和 hooks 已通过静态兼容测试。
- 当前环境没有安装 Claude Code，因此尚未完成 Claude Code 实机行为验证。

当前版本适合作为 Codex CLI 的个人开发流程使用；跨平台发布结论仍需补充 Claude Code 实机验证。

## 核心设计

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

## 工作方式

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

## 支持环境

- Codex CLI
- Claude Code

其他 agent hosts 暂不在支持范围内。

## 安装

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

## 快速开始

对于清晰、局部、低风险的任务，不需要调用完整 skill，直接描述需求即可：

```text
给 formatDisplayName 增加可选 middleName；空白 middleName 忽略。保留现有导出，添加聚焦测试，不要提交。
```

Core 会自动检查仓库规则、现有实现和相关测试；只有存在会改变业务结果、接口、数据、安全或验收口径的不确定项时才会停下来提问。

需要完整 workflow 时显式调用：

```text
Codex CLI:   $engineering-flow:develop 实现批量导出功能，完成测试并同步权威设计文档。
Claude Code: /engineering-flow:develop 实现批量导出功能，完成测试并同步权威设计文档。
```

## Workflows 使用指南

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

## 推荐开发流程

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

## 与项目规则协作

- 当前用户请求和项目内 `AGENTS.md`、`CLAUDE.md` 优先于本插件。
- 业务口径、接口、SQL、字段和验收标准应继续放在项目自己的权威文档中。
- 本插件不会强制项目采用新的文档目录、分支策略、提交格式或设计模式。
- 未经用户授权，不会因为 workflow 自动获得 commit、push、发布、创建 issue、安装依赖或修改全局配置的权限。

## 更新

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

## 卸载

```bash
codex plugin remove engineering-flow@engineering-flow
codex plugin marketplace remove engineering-flow
```

## 开发与测试

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

## 已知限制

- Claude Code 真实安装与行为尚未在当前开发环境验证。
- 当前基准使用强模型；Candidate 的主要收益是稳定关键流程边界，而不是让所有任务获得更高正确率。
- 完整 workflow 会增加上下文、工具调用和耗时，因此保持显式调用。
- 当前版本为 `0.1.0`，未来 workflow 名称和细节仍可能在新证据下调整。

## 致谢与许可

本项目参考并重新组织了以下项目中的部分思想：

- [Superpowers](https://github.com/obra/superpowers)
- [Matt Pocock Skills](https://github.com/mattpocock/skills)
- [Ponytail](https://github.com/DietrichGebert/ponytail)

具体归属见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。项目采用 [MIT License](LICENSE)。
