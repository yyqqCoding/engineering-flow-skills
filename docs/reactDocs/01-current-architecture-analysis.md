# 当前架构深度分析（第1部分：整体架构）

## 项目本质理解

**这是一个完整的 AI 工作流插件系统，不仅仅是技能集合**

```
engineering-flow-skills/
├── skills/           # 7个显式工作流
├── hooks/            # 钩子系统（自动注入）
├── config/           # 技能注册和依赖
├── .codex-plugin/    # Codex CLI 插件配置
├── .claude-plugin/   # Claude Code 插件配置
└── baseline/         # 参考项目（superpowers/mattpocock/ponytail）
```

### 核心机制

1. **SessionStart Hook** (`hooks/session-start.js`)
   - 每次新会话自动注入 228 词的 Core
   - Core 永远存在，无需用户调用

2. **UserPromptSubmit Hook** (`hooks/user-prompt-submit.js`)
   - 监听用户输入中的 `$engineering-flow:xxx` token
   - 动态加载对应的 SKILL.md
   - 仅当次请求有效（不污染后续对话）

3. **Skills Registry** (`config/skills.json`)
   - 定义所有技能及其依赖关系
   - 控制调用权限（user/auto）

---

## 当前 7 个 Skills 逐行分析

### 行数统计
```
hooks/core.md                   13 行（228词）
skills/develop/SKILL.md         89 行
skills/clarify/SKILL.md         56 行
skills/diagnose/SKILL.md        50 行
skills/code-design/SKILL.md     87 行
skills/review/SKILL.md          53 行
skills/verify-and-reconcile/    48 行
skills/handoff/SKILL.md         34 行
────────────────────────────────────
总计: 430 行（不含 core）
```

---

## 深度分析：develop（89行）

### 职责范围
```
发现 → 对齐 → 选择边界 → 选择反馈 → 实施 → 审查 → 完成
```

### 两种模式
```yaml
Normal 模式:
  触发: $engineering-flow:develop
  行为: "ask only blocking questions"
  适用: 需求清晰的场景
  
Confirm 模式:
  触发: $engineering-flow:develop confirm
  行为: "present checkpoint and wait"
  适用: 需求模糊，必须先确认
```

### 关键设计决策

**决策1: Normal vs Confirm**
```
第12-15行:
- Normal: 只问阻塞性问题，其余自主决定
- Confirm: 呈现检查点，等待明确批准

设计意图:
  ✅ 避免每次都问一堆问题（grell-docs陷阱）
  ✅ 保留"必须先确认"的安全模式
```

**决策2: 步骤2 "Align" 的提问策略**
```
第38-39行:
"Ask only questions whose answers materially change 
behavior, interfaces, data semantics, permissions, 
security, compatibility, destructive effects, or 
acceptance criteria."

关键词: "materially change"
→ 这是核心过滤器，避免过度提问
```

**决策3: 步骤7 "Complete" 强制调用 verify-and-reconcile**
```
第86-87行:
"Use verify-and-reconcile. Do not commit, push, 
publish, create external issues, install 
dependencies, or change global configuration 
unless authorized."

问题: verify-and-reconcile 是强制步骤还是可选？
→ "Use" 表示强制
→ 但 verify-and-reconcile 又是独立的 skill
→ 这造成了架构耦合
```

### 依赖关系分析（config/skills.json）
```json
"develop": {
  "invocation": "user",
  "dependencies": [
    "diagnose",          // 步骤1可能路由到diagnose
    "code-design",       // 步骤3可能需要设计评估
    "verify-and-reconcile"  // 步骤7强制调用
  ]
}
```

**问题识别**:
- develop 有 3 个依赖，复杂度较高
- verify-and-reconcile 既是步骤又是独立 skill（双重身份）

---

## 深度分析：clarify（56行）

### 职责范围
```
读取 → 构建歧义图 → 高效提问 → 产出简要
```

### 与 develop confirm 的重叠度分析

**clarify 的核心逻辑**（第12-28行）:
```markdown
## 2. Build an ambiguity map
Check only dimensions that can change the product result:
- Actors and permissions
- User-visible success behavior
- Empty, duplicate, partial, concurrent, and failure cases
- Data meaning, lifecycle, retention, and deletion
- Compatibility and migration
- Security and trust boundaries
- External-system behavior
- Acceptance criteria and out of scope
```

**develop confirm 的核心逻辑**（第28-40行）:
```markdown
## 2. Align
Produce a concise checkpoint:
- Goal
- Acceptance behavior
- Out of scope
- Assumptions derived from repository evidence
- Blocking ambiguities

Ask only questions whose answers materially change 
behavior, interfaces, data semantics, permissions, 
security, compatibility, destructive effects, or 
acceptance criteria.
```

**重叠度计算**:
```
clarify 检查的维度:
1. Actors and permissions          ✅ develop 也检查 (permissions)
2. User-visible success behavior   ✅ develop 也检查 (behavior)
3. Failure cases                   ✅ develop 也检查 (destructive effects)
4. Data meaning/lifecycle          ✅ develop 也检查 (data semantics)
5. Compatibility and migration     ✅ develop 也检查 (compatibility)
6. Security and trust boundaries   ✅ develop 也检查 (security)
7. External-system behavior        ✅ develop 也检查 (interfaces)
8. Acceptance criteria             ✅ develop 也检查 (acceptance criteria)

重叠度: 8/8 = 100%
```

**唯一区别**:
```
clarify:  只产出简要，不实施
develop:  产出简要 + 实施

→ clarify 本质上就是 develop 的前半部分
→ develop confirm 已经包含了 clarify 的全部功能
```

### 用户困惑场景模拟
```
场景: 用户想"先讨论需求，不立即实施"

选项A: $engineering-flow:clarify
选项B: $engineering-flow:develop confirm

问题: 两者功能完全相同，造成选择困惑
      用户需要理解"什么时候用A，什么时候用B"
      
实际上: B 完全包含 A 的功能
```

---

## 深度分析：verify-and-reconcile（48行）

### 职责范围
```
清点 → 验证 → 对账行为 → 对账文档 → 清理并报告
```

### 与 develop 的关系

**develop 的步骤7**:
```markdown
## 7. Complete
Use `verify-and-reconcile`. Do not commit, push, 
publish, create external issues, install 
dependencies, or change global configuration 
unless authorized.
```

**问题1: 双重身份**
```
身份1: develop 的内部步骤（第7步）
身份2: 独立的用户可调用 skill

这造成:
  ❌ 架构混乱（是子过程还是独立流程？）
  ❌ 用户困惑（什么时候单独调用？）
  ❌ 依赖复杂（develop 依赖 verify-and-reconcile）
```

**问题2: "Use" 的强制性**
```
develop 说: "Use verify-and-reconcile"
→ 这意味着强制调用

但 verify-and-reconcile 的描述说:
"Use for changes whose completion needs more 
than the Core's focused fresh-verification rule."
→ 这意味着可选调用（"needs more"）

矛盾: 一个说强制，一个说可选
```

**问题3: 何时"needs more"？**
```
verify-and-reconcile 开头说:
"Use for changes whose completion needs more"

但没有明确定义什么是"needs more"

用户无法判断:
  - 简单功能 → 需要吗？
  - 复杂功能 → 肯定需要？
  - 中等复杂度 → ???
```

### 架构问题根源

**设计意图推测**:
```
原本想法:
  develop = 核心开发流程（轻量）
  verify-and-reconcile = 可选的深度验证（重量）
  
实际情况:
  develop 步骤7强制要求"Use verify-and-reconcile"
  → 导致 verify 不再可选
  → 失去了轻量/重量分离的意义
```

**更好的设计**:
```
选项A: verify-and-reconcile 完全内部化
  - 删除独立 skill
  - develop 内部包含所有验证逻辑
  - develop 自动判断是否需要深度验证
  
选项B: verify-and-reconcile 真正可选化
  - develop 只做基础验证
  - 用户需要深度验证时才调用 verify-and-reconcile
  - 删除 develop 对 verify 的强制依赖
```
