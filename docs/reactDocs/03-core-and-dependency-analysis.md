# 当前架构深度分析（第3部分：核心机制与依赖图谱）

## 深度分析：handoff（34行）

### 职责范围
```
生成跨会话交接记录
```

### 设计特点

**特点1: 最简洁的技能**
```
只有 34 行，是所有技能中最短的
→ 职责非常单一：生成交接文档
→ 无复杂逻辑，无依赖
```

**特点2: 状态快照**
```markdown
第7-8行（预期输出）:
"生成当前工作的续接记录，包含目标、已完成状态、
关键文件、最新验证、剩余任务、风险和 Git 状态。"

关键要素:
  - 目标（Goal）
  - 已完成状态（What's done）
  - 关键文件（Key files）
  - 最新验证（Latest verification）
  - 剩余任务（Remaining tasks）
  - 风险（Risks）
  - Git 状态（Git state）
```

### 使用场景

**您提到的场景**: "当前上下文比较多了，用户需要开一个新的上下文"

**handoff 的价值**:
```
问题: Claude 上下文窗口有限（100万token）
      长时间开发会消耗大量上下文
      需要开新会话时，如何不丢失状态？

解决: handoff 生成紧凑的交接文档
      新会话读取交接文档即可继续
```

### 依赖关系

```json
"handoff": {
  "invocation": "user",
  "dependencies": []
}
```

**分析**:
- 无依赖 → 可随时调用
- 纯输出型技能 → 不修改代码
- 与其他技能正交 → 任何阶段都可用

### 优化方向

**当前设计的优点**（保持）:
- ✅ 极简设计（34行）
- ✅ 职责单一
- ✅ 无依赖，易于使用
- ✅ 满足"开新会话"的需求

**可优化点**:
- ⚠️ 文档内容未在 SKILL.md 中详细定义
- ⚠️ 可以添加"交接文档模板"

---

## 核心机制深度分析：Core（13行，228词）

### Core 的完整内容逐行分析

```markdown
第1行: # Engineering Core

第3行: These rules apply to code changes. 
       Project instructions and the current 
       user request take precedence.
→ 明确优先级：项目规则 > Core 规则

第5-6行: Before editing, inspect once 
         in-repository: status, applicable 
         instructions/docs, relevant code, 
         tests, callers. Preserve unrelated 
         work; avoid broad parent searches.
→ 发现阶段：一次性检查，避免过度搜索

第7-8行: Confirm goal, acceptance, scope, 
         assumptions. Ask only about details 
         materially changing behavior, 
         interfaces, data, permissions, 
         security, compatibility, destructive 
         effects, or acceptance. Infer 
         reversible choices from repository 
         precedent.
→ 对齐阶段：仅问"materially changing"的问题

第9-10行: Find existing domain behavior. 
          Put rules with their owning module; 
          fix a shared root cause when sibling 
          callers should change together.
→ 边界选择：找到正确的所有权

第11-13行: Prefer familiar, explicit, local, 
           debuggable code—not minimum lines. 
           Uncommon syntax, dense expressions, 
           hidden effects, metaprogramming, 
           dependencies, abstractions, or 
           patterns require concrete benefit. 
           Reuse only identical domain behavior 
           that should evolve together; avoid 
           speculative extensions.
→ 实施原则：可维护性 > 行数
→ 新颖性税原则
→ 语义复用原则

第14行: Preserve validation, permissions, 
        security, data integrity, 
        compatibility, accessibility, and 
        unrelated work.
→ 安全原则：保护关键属性

第15行: Verify review feedback against code, 
        requirements, and conventions before 
        applying it.
→ 审查反馈验证原则

第16-17行: Observe a focused failure first 
           for reported regressions or 
           high-risk business behavior when 
           a stable seam exists. Otherwise 
           implement with focused tests or 
           the smallest meaningful compile, 
           lint, integration, or behavioral 
           check; do not create ceremonial tests.
→ 测试策略：TDD for 回归，务实测试 for 其他

第18-19行: Before completion, run fresh 
           scope-appropriate verification; 
           remove diagnostics and report gaps. 
           Reconcile authoritative docs without 
           rewriting requirements; update 
           project instructions only for 
           durable rules.
→ 完成原则：新鲜证据，文档对账，仅持久规则

第20行: Do not commit, push, merge, publish, 
        create issues, install dependencies, 
        or change global configuration 
        without user authorization.
→ 权限边界：外部操作需授权
```

### Core 的设计哲学

**1. 优先级清晰**
```
第3行明确: 项目规则 > Core 规则
→ Core 是默认行为，不是强制规则
→ 用户的 AGENTS.md 可以覆盖 Core
```

**2. 避免过度行为**
```
过度搜索: "avoid broad parent searches"
过度提问: "Ask only about... materially changing"
过度测试: "do not create ceremonial tests"
过度抽象: "avoid speculative extensions"

→ 这些都是针对 AI 常见问题的预防
→ AI 倾向于"做太多"，Core 限制这种倾向
```

**3. 压缩的智慧**
```
13行，228词
但包含了:
  - 发现流程
  - 对齐策略
  - 边界选择
  - 实施原则
  - 安全原则
  - 测试策略
  - 完成验证
  - 权限边界

→ 极高的信息密度
→ 每句话都是关键原则
```

### Core 与 Skills 的关系

**Core 是所有 Skills 的基础**:
```
Core: 228词，永远存在
Skills: 430行，按需加载

关系:
  Core  → 提供通用原则
  Skills → 提供具体流程
  
示例:
  Core 说: "Ask only about materially changing"
  develop 说: "Ask only questions whose answers materially change..."
  clarify 说: "Check only dimensions that can change the product result"
  
→ Skills 复述和扩展 Core 的原则
→ Core 是"宪法"，Skills 是"实施细则"
```

### Core 的优化空间

**当前设计的优点**（保持）:
- ✅ 极高的信息密度（228词）
- ✅ 优先级清晰（项目规则优先）
- ✅ 针对 AI 过度行为的预防
- ✅ 永远存在，无需用户记忆

**可优化点**:
```
第5-6行: "avoid broad parent searches"

问题: 现代模型（Fable 5）搜索能力很强
      这个限制可能过于保守

建议: 改为 "search efficiently when ownership unclear"
      允许多次搜索，但要求高效
      
理由: 找到正确的所有权 > 节省搜索次数
```

---

## 依赖关系全图谱分析

### 当前依赖关系（从 config/skills.json）

```
develop
  ├── diagnose
  ├── code-design
  └── verify-and-reconcile

clarify
  (无依赖)

diagnose
  └── verify-and-reconcile

code-design
  (无依赖)

review
  └── code-design

verify-and-reconcile
  (无依赖)

handoff
  (无依赖)
```

### 可视化依赖图

```
              ┌─────────────────┐
              │ verify-and-     │ (被2个技能依赖)
              │ reconcile       │
              └─────────────────┘
                     ▲    ▲
                     │    │
        ┌────────────┘    └────────────┐
        │                              │
┌───────────────┐             ┌───────────────┐
│ develop       │             │ diagnose      │
│ (3个依赖)     │             │ (1个依赖)     │
└───────────────┘             └───────────────┘
        │                     
        │                     
        └────────────┐        
                     ▼        
              ┌─────────────────┐
              │ code-design     │ (被2个技能依赖)
              └─────────────────┘
                     ▲
                     │
              ┌─────────────────┐
              │ review          │
              └─────────────────┘

独立技能（无依赖）:
┌─────────────────┐
│ clarify         │
└─────────────────┘

┌─────────────────┐
│ handoff         │
└─────────────────┘
```

### 依赖关系问题识别

**问题1: verify-and-reconcile 的核心地位**
```
被依赖次数: 2次（develop, diagnose）
依赖其他技能: 0次

分析:
  → verify-and-reconcile 是"基础设施"
  → 但它本身又是用户可调用的技能
  → 双重身份造成混乱

根本问题:
  develop 和 diagnose 的完成步骤都需要验证
  但验证应该是"内部步骤"还是"独立技能"？
  
当前设计: 独立技能
问题: develop 步骤7说"Use verify-and-reconcile"
      → 暴露了内部实现细节
      → 用户需要理解"什么是 verify-and-reconcile"
```

**问题2: code-design 的中立地位**
```
被依赖次数: 2次（develop, review）
依赖其他技能: 0次

分析:
  → code-design 是"参考标准"
  → develop 和 review 都参考它
  → 这个设计是合理的

设计意图:
  code-design = 设计原则
  develop = 应用原则进行实施
  review = 应用原则进行检查
  
结论: 这个依赖关系是合理的，保持
```

**问题3: clarify 的孤立地位**
```
被依赖次数: 0次
依赖其他技能: 0次

分析:
  → clarify 完全独立
  → 没有其他技能依赖它
  → develop confirm 模式复制了它的功能
  
问题:
  如果 clarify 是重要的，为什么没有被依赖？
  如果 clarify 不重要，为什么存在？
  
答案:
  clarify 和 develop confirm 功能重叠
  → 其中一个是多余的
```

### 依赖关系优化方向

**优化方向1: 内部化 verify-and-reconcile**
```
当前:
  develop → verify-and-reconcile (依赖)
  diagnose → verify-and-reconcile (依赖)
  verify-and-reconcile (独立技能)

优化后:
  develop (内置验证逻辑)
  diagnose (内置验证逻辑)
  ❌ verify-and-reconcile (删除)

收益:
  ✅ 依赖关系简化
  ✅ 封装性提高
  ✅ 用户理解成本降低
```

**优化方向2: 移除 clarify**
```
当前:
  clarify (独立技能，无依赖，不被依赖)
  develop confirm (功能重叠)

优化后:
  develop (两种模式: normal / confirm)
  ❌ clarify (删除)

收益:
  ✅ 消除功能重叠
  ✅ 用户选择简化
  ✅ 技能数量减少
```

**优化方向3: 保持 code-design 的中立地位**
```
当前:
  code-design (被 develop 和 review 依赖)

优化后:
  保持不变

理由:
  ✅ 作为"设计标准"的定位清晰
  ✅ 依赖关系合理
  ✅ 无需优化
```
