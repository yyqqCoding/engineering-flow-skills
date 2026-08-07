<div align="center">
  <picture>
    <source media="(max-width: 640px) and (prefers-color-scheme: dark)" srcset="assets/readme/hero-mobile-dark.svg">
    <source media="(max-width: 640px) and (prefers-color-scheme: light)" srcset="assets/readme/hero-mobile-light.svg">
    <source media="(prefers-color-scheme: dark)" srcset="assets/readme/hero-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="assets/readme/hero-light.svg">
    <img alt="Engineering Flow：从仓库事实发现、需求澄清、实施批准到编码与验证的任务级工作流" src="assets/readme/hero-light.svg" width="100%">
  </picture>
  <br><br>
  <strong>面向 Codex CLI 与 Claude Code 的任务级开发工作流与评测框架</strong>
  <br><br>
  <a href="#快速开始"><strong>快速开始</strong></a>
  &nbsp;&nbsp;·&nbsp;&nbsp;
  <a href="#五个工作流">工作流</a>
  &nbsp;&nbsp;·&nbsp;&nbsp;
  <a href="#验证结果">验证结果</a>
  &nbsp;&nbsp;·&nbsp;&nbsp;
  <a href="docs/user-guide.zh-CN.md">用户指南</a>
  <br><br>
  <a href="README.md">简体中文</a>&nbsp;·&nbsp;<a href="README.en.md">English</a>
  <br><br>
  <img alt="Codex CLI" src="https://img.shields.io/badge/Codex_CLI-supported-111820?style=flat-square">
  <img alt="Claude Code" src="https://img.shields.io/badge/Claude_Code-supported-D97757?style=flat-square">
  <img alt="License MIT" src="https://img.shields.io/badge/license-MIT-4C5D6B?style=flat-square">
</div>

---

## 核心思想

> 先把需求理解到足以安全实施，再在正确边界写最小但清晰的代码，用有效反馈证明它工作，最后让文档反映事实、让项目规则只沉淀长期经验。

| 理解 | 确认 | 实施 | 证明 |
|---|---|---|---|
| 先读项目规则、权威文档、代码和测试 | 只澄清影响验收的未决行为，输出最终检查点 | 复用正确的领域能力，在所属模块完成最小改动 | 用风险匹配的测试与新鲜证据验证，并同步事实 |

Engineering Flow 解决三个 Coding Agent 中反复出现的问题：

- **流程强度失衡：** 简单任务直接处理；完整工作流只在用户显式选择时加载。
- **多轮任务中断：** 回答、批准、纠正和补漏保持同一任务上下文，不必重复调用入口。
- **澄清与授权混淆：** 独立问题批量询问，依赖问题顺序追问；回答问题不等于批准编码。

## 五个工作流

| 工作流 | 交付结果 | Codex 调用 |
|---|---|---|
| **Develop** | 对齐需求，等待批准，再实现、测试并同步文档 | `$engineering-flow:develop` |
| **Diagnose** | 复现并定位根因，获得授权后修复和回归验证 | `$engineering-flow:diagnose` |
| **Code Design** | 创建或完善可实施方案，不写生产代码 | `$engineering-flow:code-design` |
| **Review** | 对 diff、分支或未提交改动进行严格只读评审 | `$engineering-flow:review` |
| **Handoff** | 保存下一会话继续所需的最小任务状态 | `$engineering-flow:handoff` |

Claude Code 使用相同名称，将 `$engineering-flow:` 替换为 `/engineering-flow:`。

## 任务级连续性

显式调用选择的是整个任务的处理方式，而不是只约束当前消息：

```text
发现与澄清 ──► 最终检查点 ──► 等待批准 ──► 实施与验证 ──► 完成
     ▲                                  │           │
     └────── 新范围只确认增量 ─────────────┘           │
                         原验收遗漏直接恢复实施 ◄───────┘
```

- “按上述方案执行”可以在最终检查点后批准实施；“已阅读”和澄清答案不能。
- 用户否定诊断时，Diagnose 保持只读并验证新假设；授权修复后无需切换 Develop。
- 明确取消、切换工作流或开始无关任务时，旧工作流与旧授权结束。

## 工程判断

| 关注点 | 默认决策 |
|---|---|
| **需求** | 用户决定产品行为；Agent 自主处理可从仓库发现的可逆实现细节 |
| **代码** | 复用应共同演进的领域规则；不因代码相似而投机抽象 |
| **测试** | 回归和高风险行为优先先红后绿；机械改动使用更直接的验证 |
| **安全** | Review 严格只读；提交、发布、全局配置和破坏性操作不继承开发授权 |
| **文档** | 小需求在对话确认；大需求遵循项目约定，没有约定时使用 `docs/requirements/` |

## 快速开始

### Codex CLI

```bash
codex plugin marketplace add yyqqCoding/engineering-flow-skills
codex plugin add engineering-flow@engineering-flow
```

### Claude Code

```text
/plugin marketplace add yyqqCoding/engineering-flow-skills
/plugin install engineering-flow@engineering-flow
```

安装后开启新会话。清晰的小任务直接描述；需要完整开发流程时显式调用：

```text
$engineering-flow:develop
实现订单批量导出。先检查现有设计、代码边界和验收行为；完成澄清后给出最终检查点并暂停。不要提交。
```

阅读确认内容后回复：

```text
按上述方案执行。
```

## 验证结果

<picture>
  <source media="(max-width: 640px) and (prefers-color-scheme: dark)" srcset="assets/readme/evidence-mobile-dark.svg">
  <source media="(max-width: 640px) and (prefers-color-scheme: light)" srcset="assets/readme/evidence-mobile-light.svg">
  <source media="(prefers-color-scheme: dark)" srcset="assets/readme/evidence-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="assets/readme/evidence-light.svg">
  <img alt="Engineering Flow 验证结果：通用行为 45/51 提升至 51/51，多轮连续性 0/12 提升至 12/12，确定性测试 49/49，显式路由 51/51" src="assets/readme/evidence-light.svg" width="100%">
</picture>

[查看评测方法](docs/testing-strategy.md) · [查看完整记录](docs/benchmark-log.md)

## 文档

| 使用 | 设计 | 证据 |
|---|---|---|
| [用户指南](docs/user-guide.zh-CN.md) | [产品设计](docs/product-design.md) | [基准记录](docs/benchmark-log.md) |
| [触发模型](docs/trigger-model.md) | [行为规范](docs/behavior-spec.md) | [测试策略](docs/testing-strategy.md) |

Engineering Flow 聚焦 Coding Agent 的工作流、上下文、多轮交互和可靠性评测，不是通用 Agent Runtime，也不接管项目的 Issue、分支、提交和发布流程。

## 许可

项目采用 [MIT License](LICENSE)。相关项目归属见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
