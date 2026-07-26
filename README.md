# Engineering Flow Skills

[简体中文](README.md) | [English](README.en.md)

> 让编码 Agent 先理解、再实现，并用证据完成交付。

![Codex CLI](https://img.shields.io/badge/Codex_CLI-supported-black)
![Claude Code](https://img.shields.io/badge/Claude_Code-supported-D97757)
![License](https://img.shields.io/badge/license-MIT-blue)

Engineering Flow 是一套面向 **Codex CLI** 和 **Claude Code** 的软件开发工作流插件。它覆盖方案设计、需求对齐、实现、故障诊断、评审和跨会话交接——同时让清晰的小任务保持简单。

## 为什么是 Engineering Flow

### 📐 每条规则都经过基准检验

多数工作流插件靠直觉堆规则，Engineering Flow 用数据裁决：每个触发方式和关键措辞都经过隔离的 A/B 基准检验——17 个确定性行为场景、隐藏评分器、污染检测、未授权提交监控。跑不赢强基线的功能会被删除，而不是保留下来装点门面：自动技能触发就是这样被否决的（数据反复证明它会在不相关任务上误载工作流）。每个决策的证据链都可以在 [基准记录](docs/benchmark-log.md) 中回溯。

### 🎯 确定性触发，工作流不会不请自来

完整工作流只在你显式点名时加载，由 hook 精确路由，每次调用恰好注入一份上下文。没有概率式的"模型觉得你需要"——不会在你改一行配置时被拖进五步大流程，也不会在你要求评审时被替换成别的工作流。

### 🏛️ 软件工程学内核

Engineering Flow 把经典软件工程原则翻译成 Agent 可执行的判断规则——每条原则都有明确的触发信号和成本约束，而不是名词清单：

| 软件工程思想 | 在工作流中的形态 |
|---|---|
| 高内聚、低耦合 | 方案对比必须评估所有权、耦合、内聚与状态/失败行为 |
| 单一职责 | 一条规则只有一个权威 owner；规则放进拥有相关数据和不变量的模块 |
| 开闭原则 | 只在"同一变化轴上反复出现分支"等真实压力下才引入扩展点，并显式拒绝投机性扩展点 |
| 依赖倒置 | 只有不稳定的外部依赖才值得 Adapter；方案必须写明依赖方向 |
| 设计模式 | Strategy、状态机、Adapter、工厂/建造者、管道各有明确触发条件——消除的复杂度必须大于引入的间接性 |
| 语义化复用 | 区分"应一起演进的同一领域规则"与"碰巧相似的独立规则"，允许合理重复，拒绝错误去重 |

在此之上还有一条**新颖性税**：任何不常见语法、元编程、新依赖、抽象或设计模式，都必须用正确性、实测性能或总维护成本上的具体收益来支付。模式的名字本身不是质量证据。

这套标准同时作用于 `code-design` 的方案推演和 `develop` 的实现与条件性加固，设计和编码执行的是同一份工程判断。

### 🪶 常驻成本约 230 词

始终生效的只有一份约 230 词的 Engineering Core——仓库勘察、需求对齐、可维护性、安全保全和验证收尾的工程底线。不显式调用工作流时，上下文零额外注入，token 留给真正的任务。

### 🔒 安全与授权边界

- 未经授权，绝不提交、推送、发布、创建 issue、安装依赖或修改全局配置。
- 破坏性数据决策（如关联数据如何处理）必须先问清楚，绝不静默推断。
- `review` 严格只读；`code-design` 只出方案不写产品代码；诊断与修复分离，修复需要明确授权。

### 🤝 不接管项目

当前用户要求、项目内 `AGENTS.md`、`CLAUDE.md` 和权威文档始终优先。流程随任务伸缩：简单任务直接完成，边界测试取决于真实风险，架构改进取决于真实设计压力——不强制计划文件、工作树、子代理、TDD 或提交仪式。

## 🧩 一个工作流，五个入口

| 入口 | 适合做什么 | 调用方式 |
|---|---|---|
| 🛠️ **Develop** | 新功能、重构、补测试、代码完善 | `$engineering-flow:develop` |
| 🔎 **Diagnose** | bug、回归、错误输出、间歇故障、性能下降 | `$engineering-flow:diagnose` |
| 🧭 **Code Design** | 从 0 出方案或完善已有设计 | `$engineering-flow:code-design` |
| 👀 **Review** | 严格只读评审 diff、分支或未提交改动 | `$engineering-flow:review` |
| 📦 **Handoff** | 换会话或交给其他 Agent 继续 | `$engineering-flow:handoff` |

Claude Code 使用相同名称，将 `$engineering-flow:` 替换为 `/engineering-flow:`。

## ⚙️ 工作机制

```text
会话开始（startup / resume / clear / compact）
  └─► 注入约 230 词 Engineering Core —— 始终生效的工程与安全底线

显式点名某个工作流
  └─► 当轮注入该工作流的完整 SKILL.md，恰好一份

其余所有提示
  └─► 零注入，保持原生体验
```

两个平台共享同一套技能与 hook，调用元数据由静态测试保证一致。

## 🚀 Quick Start

### Codex CLI

```bash
codex plugin marketplace add yyqqCoding/engineering-flow-skills
codex plugin add engineering-flow@engineering-flow
```

安装后，在项目目录开启一个新会话：

```bash
cd /path/to/your-project
codex
```

### Claude Code

在 Claude Code 中执行：

```text
/plugin marketplace add yyqqCoding/engineering-flow-skills
/plugin install engineering-flow@engineering-flow
```

## 💬 开始使用

清晰的小任务，直接描述：

```text
给用户列表增加状态筛选。复用现有查询参数和组件，添加最小验证，不要提交。
```

需要完整开发流程时，显式选择入口：

```text
$engineering-flow:develop
实现订单批量导出。先理解现有设计和代码边界，完成实现、聚焦测试和必要文档更新。不要提交。
```

必须先确认再编码：

```text
$engineering-flow:develop confirm
实现客户批量删除。先确认需求、关联数据策略和验收行为，得到我的确认后才能编码。
```

更多场景和完整示例见 [用户指南](docs/user-guide.zh-CN.md)。

## 📚 Documentation

- [用户指南：完整用法、安装、更新与排障](docs/user-guide.zh-CN.md)
- [产品设计](docs/product-design.md)
- [行为规范](docs/behavior-spec.md)
- [触发模型](docs/trigger-model.md)
- [测试策略](docs/testing-strategy.md)
- [A/B 基准记录](docs/benchmark-log.md)

## 🤝 Credits

Engineering Flow 参考并重新组织了以下项目中的部分思想：

- [Superpowers](https://github.com/obra/superpowers)
- [Matt Pocock Skills](https://github.com/mattpocock/skills)
- [Ponytail](https://github.com/DietrichGebert/ponytail)

具体归属见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。项目采用 [MIT License](LICENSE)。
