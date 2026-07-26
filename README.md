# Engineering Flow Skills

[简体中文](README.md) | [English](README.en.md)

> 让编码 Agent 先理解、再实现，并用证据完成交付。

Engineering Flow 是一套面向 **Codex CLI** 和 **Claude Code** 的完整软件开发工作流。它覆盖方案设计、需求与方案对齐、实现、故障诊断、评审、验证和跨会话交接，同时让清晰的小任务保持简单。

## ✨ Highlights

- 🎯 **先对齐，再编码** — 只在会实质改变结果时提问，避免带着错误假设实现。
- 🧭 **找到正确边界** — 优先发现现有能力、正确所有权和真正的共享根因。
- 🛠️ **面向长期维护** — 追求清晰、显式、局部可理解的代码，而不是最少行数。
- 🧪 **用证据完成任务** — 根据风险选择测试、编译、lint 或集成验证，并同步权威文档。
- 🪶 **保持轻量** — 不强制计划文件、工作树、子代理、TDD、设计模式或提交仪式。

## 🧩 一个工作流，按任务选择入口

| 入口 | 适合做什么 | 调用方式 |
|---|---|---|
| 🛠️ **Develop** | 新功能、重构、补测试、代码完善 | `$engineering-flow:develop` |
| 🔎 **Diagnose** | bug、回归、错误输出、间歇故障、性能下降 | `$engineering-flow:diagnose` |
| 🧭 **Code Design** | 从 0 出方案或完善已有设计 | `$engineering-flow:code-design` |
| 👀 **Review** | 严格只读评审 diff、分支或未提交改动 | `$engineering-flow:review` |
| 📦 **Handoff** | 换会话或交给其他 Agent 继续 | `$engineering-flow:handoff` |

Claude Code 使用相同名称，将 `$engineering-flow:` 替换为 `/engineering-flow:`。

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

## 🧠 设计原则

Engineering Flow 不接管项目。当前用户要求、项目内 `AGENTS.md`、`CLAUDE.md` 和权威文档始终优先。

它提供的是稳定的工程行为，而不是固定仪式：

- 简单任务直接完成，复杂任务按需展开。
- 边界测试取决于真实风险，不机械枚举极端情况。
- 代码完善取决于真实设计压力，不为了模式而使用模式。
- 未经授权，不会提交、推送、发布、创建 issue、安装依赖或修改全局配置。

## 📚 Documentation

- [用户指南：完整用法、安装、更新与排障](docs/user-guide.zh-CN.md)
- [产品设计](docs/product-design.md)
- [行为规范](docs/behavior-spec.md)
- [触发模型](docs/trigger-model.md)
- [测试策略](docs/testing-strategy.md)
- [A/B 基准记录](docs/benchmark-log.md)

## ✅ Evidence

- 36/36 静态与确定性测试通过。
- Codex 当前验证 cohort：17 个场景，candidate 51/51 通过。
- 显式 workflow 调用 51/51，误触发、漏触发、碰撞、污染和未授权提交均为 0。
- Claude Code 已通过 strict manifest 校验和显式 `develop` 实机样本。

完整环境、结果与跨平台限制见 [基准记录](docs/benchmark-log.md)。

## 🤝 Credits

Engineering Flow 参考并重新组织了以下项目中的部分思想：

- [Superpowers](https://github.com/obra/superpowers)
- [Matt Pocock Skills](https://github.com/mattpocock/skills)
- [Ponytail](https://github.com/DietrichGebert/ponytail)

具体归属见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。项目采用 [MIT License](LICENSE)。
