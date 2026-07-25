# Engineering Flow Skills 深度优化分析 v2

## 🎯 问题重新定位

### 您的真实意图
- ✅ **baseline/** 是参考资料（superpowers/mattpocock/ponytail）
- ✅ **skills/** 是您的实际实现（已经是精简版）
- ✅ 目标：在已精简的基础上，取精华、去糟粕，进一步优化

### 三大参考项目的问题

| 项目 | 核心问题 | 您已避免的方式 |
|-----|---------|--------------|
| **superpowers** | 流程太重，每句话都触发完整流程 | 您用显式 `$engineering-flow:*` token，不自动触发 ✅ |
| **mattpocock/skills (grell-docs)** | 每次问几百个问题，过度澄清 | 您的 clarify 只问"materially changing"的问题 ✅ |
| **ponytail** | 为了少而少，用代码行数衡量好坏 | 您强调"maintainable expression"而非"minimum lines" ✅ |

### 您当前的架构（7个skills）

```
核心: 228词 Core（自动加载）

显式workflows（用户token触发）:
1. develop          - 完整开发流程
2. clarify          - 需求澄清（不编码）
3. diagnose         - 问题诊断
4. code-design      - 代码设计
5. review           - 只读审查
6. verify-and-reconcile - 验证与文档对账
7. handoff          - 跨会话交接
```

---

## 🔍 当前架构的优点（保持）

### 1. 轻量Core + 显式Workflows ⭐⭐⭐
**非常好的设计**
- Core只有228词，自动生效
- Workflows需要用户显式调用（`$engineering-flow:*`）
- **避免了superpowers的"每句话触发完整流程"问题**

### 2. 问题导向，而非仪式导向 ⭐⭐⭐
```
develop: "ask only blocking questions"
clarify: "Ask only about details materially changing behavior"
diagnose: "only when requested"
```
**避免了grell-docs的"几百个问题"问题**

### 3. 代码质量优先于行数 ⭐⭐⭐
```
code-design: "Do not optimize for line count"
core: "Prefer familiar, explicit, local, debuggable code—not minimum lines"
```
**避免了ponytail的"为了少而少"问题**

### 4. 现代模型能力适配 ⭐⭐
```
develop: "proceed when repository evidence safely resolves the rest"
clarify: "Do not ask the user to design internal classes"
```
**正确利用了强模型的推理能力**

---

## 🚨 当前架构的可优化点

### 问题1：Workflows之间的边界仍有重叠

#### 重叠1.1: develop vs clarify

**当前状态**:
```
develop 模式:
  - Normal: "ask only blocking questions"
  - Confirm: "present checkpoint and wait"

clarify:
  - "Resolve material ambiguities"
  - "Do not implement"
```

**问题**: 
- `develop confirm` 和 `clarify` 功能重叠度90%
- 用户困惑："我想先讨论需求"该用哪个？
- `develop confirm` 本质就是 `clarify + develop`

**优化建议**:
```
选项A: 移除 clarify，只保留 develop 的两种模式
  develop              → 直接实施
  develop confirm      → 先澄清后实施
  
选项B: clarify 专注"纯讨论"，develop confirm 改为"轻量确认"
  clarify              → 深度需求分析（产品级）
  develop confirm      → 技术实现确认（工程级）
  
推荐: 选项A（更简洁）
```

#### 重叠1.2: develop 的 self-review vs review

**当前状态**:
```
develop step 6: "Review... inspect the diff"
review: "Perform evidence-backed read-only review"
```

**问题**:
- develop 内部已有 review 步骤
- 独立 review 的价值在哪里？

**分析**:
```
develop 的 review:
  ✅ 实施者自我检查
  ✅ 发现问题立即修复
  ❌ 可能有盲点
  
独立 review:
  ✅ 第三方视角
  ✅ 只读，不修改
  ✅ 适合PR/分支审查
```

**优化建议**: 保持分离，但明确职责
```
develop: 内置"自我审查"（快速反馈循环）
review:  独立"第三方审查"（质量门禁）

用户场景:
- 自己开发 → develop（内置自审）
- 审查别人代码 → review
- 审查自己的大改动 → review（新鲜视角）
```

#### 重叠1.3: verify-and-reconcile 的定位模糊

**当前状态**:
```
develop step 7: "Use verify-and-reconcile"
verify-and-reconcile: "Use for changes whose completion needs more"
```

**问题**:
- 是 develop 的强制步骤？还是可选增强？
- 什么时候"needs more"？标准不清晰

**优化建议**: 简化为两种模式
```
选项A: 合并到 develop
  develop 内置基础验证
  develop --strict 触发深度验证
  
选项B: 明确触发条件
  verify-and-reconcile 仅用于:
    - 多验收项
    - 权限/数据风险
    - 迁移
    - 需要更新权威文档
    
推荐: 选项B + 在 develop 中自动判断
```

---

### 问题2：缺少的关键能力

#### 缺失2.1: 边界测试（Boundary Testing）

**您提到的需求**: "极端测试用例，测试边界情况"

**当前状态**:
```
develop: "red-green-refactor for regressions"
diagnose: "Build the fastest practical signal"
```

**问题**: 
- TDD 主要覆盖 happy path
- 边界/极端情况没有系统化方法

**建议新增**: `boundary-test` workflow

```yaml
---
name: boundary-test
description: Systematic boundary and edge case testing after feature implementation.
---

# Boundary Test

Test the boundaries TDD doesn't systematically cover.

## When to Use
- After feature passes normal tests
- Security-sensitive code
- Data processing logic
- External integrations

## Test Matrix

1. Input Boundaries
   - Null/empty/undefined
   - Min/max values
   - Type mismatches
   - Malicious input (injection, XSS)

2. State Boundaries
   - Uninitialized access
   - State transition edges
   - Concurrent access

3. Resource Boundaries
   - Memory/disk exhaustion
   - Timeout/expiration
   - Connection pool limits

4. Data Boundaries
   - Empty collections
   - Single element
   - Large collections
   - Numeric overflow/precision

5. Business Boundaries
   - Zero amounts
   - Expired tokens
   - Skipped workflow steps

## Process
1. Identify applicable boundaries
2. Generate test cases
3. Define expected behavior (fail-fast vs graceful)
4. Verify boundary protection exists
```

**与TDD的关系**:
```
TDD (develop内置):
  - 功能正确性
  - Happy path + 已知错误路径
  
boundary-test (独立workflow):
  - 鲁棒性
  - 未预期的边界和攻击
```

#### 缺失2.2: 代码重构（Refactoring）

**当前状态**:
```
develop: "red-green-refactor"（提到了，但没展开）
code-design: 评估设计，但不包含"已有代码的清理"
```

**问题**:
- 重构没有独立的workflow
- 重构和新功能混在一起（develop的REFACTOR阶段）

**是否需要独立workflow？**

**分析**:
```
支持独立 refactor workflow:
  ✅ 用户明确说"重构这段代码"
  ✅ 不改变行为，只改进质量
  ✅ 需要特殊的安全检查（测试仍通过）
  
反对独立 refactor workflow:
  ❌ 重构应该在TDD的GREEN阶段
  ❌ 独立重构容易变成"大重构"（风险高）
  ❌ 与 code-design 重叠
```

**建议**: 不新增独立workflow，强化现有能力
```
1. develop 的 REFACTOR 阶段写明确
2. code-design 覆盖"设计改进"场景
3. Core 强调"local improvement"
```

---

### 问题3：现代模型能力未充分利用

#### 3.1 代码搜索能力

**现状**:
```
Core: "inspect once in-repository"
Core: "avoid broad parent searches"
```

**问题**: 过于保守

**现代模型能力**:
- 强大的代码理解
- 快速的全仓库搜索
- 精准的调用关系分析

**建议**: 放宽限制
```
Before: "inspect once, avoid broad searches"
After:  "search efficiently across the codebase when needed"

允许:
- 多次搜索（当第一次没找到正确位置）
- 跨文件追踪（找到真正的ownership）
- 全仓库模式匹配（找到类似实现）

禁止:
- 读取整个大文件（用grep/搜索）
- 重复读取相同文件
```

#### 3.2 测试策略的现代化

**现状**:
```
develop: "ceremonial unit tests"（贬义）
develop: "mechanical... use smallest meaningful check"
```

**问题**: 可能过度反对测试

**现代实践**:
- 测试是文档
- 测试是重构安全网
- 快速反馈>测试覆盖率

**建议**: 平衡表述
```
Before: 避免"ceremonial tests"
After:  写"behaviorally sensitive tests"

原则:
  ✅ 测试公共行为，非实现细节
  ✅ 测试可以防止回归
  ✅ 机械代码用lint/compile检查
  ❌ 为了覆盖率而测试
  ❌ Mock导致的脆弱测试
```

---

## 💡 具体优化建议

### 建议1: 简化为5个Workflows（推荐⭐⭐⭐）

```
当前 7个 → 优化后 5个

1. develop          保留（合并 clarify 的 confirm 模式）
2. ❌ clarify       移除（功能被 develop confirm 覆盖）
3. diagnose         保留
4. code-design      保留
5. review           保留
6. ❌ verify-and-reconcile  移除（合并到 develop 内部）
7. handoff          保留
8. ✅ boundary-test  新增
```

**理由**:
- `clarify` ≈ `develop confirm`（90%重叠）
- `verify-and-reconcile` 是 develop 的内部步骤，不应该暴露
- `boundary-test` 填补关键空白

### 建议2: 重新定义Workflows边界

```yaml
# 1. develop - 端到端开发
触发: $engineering-flow:develop [confirm]
包含: 发现→对齐→边界选择→实施→自审→验证→文档
输出: 完成的功能 + 测试 + 文档

# 2. diagnose - 问题诊断
触发: $engineering-flow:diagnose
包含: 症状定位→复现→假设验证→修复（可选）
输出: 根因分析 + 修复（如果请求）

# 3. code-design - 设计评估
触发: $engineering-flow:code-design
包含: 压力识别→方案评估→权衡分析
输出: 设计建议（不实施）或 设计+实施

# 4. review - 第三方审查
触发: $engineering-flow:review
包含: 8维度审查（需求/正确/安全/设计/可读/测试/文档/范围）
输出: 分级问题清单（只读）

# 5. boundary-test - 边界测试
触发: $engineering-flow:boundary-test
包含: 5类边界识别→测试生成→验证→补充保护
输出: 边界测试 + 保护代码

# 6. handoff - 交接记录
触发: $engineering-flow:handoff
包含: 状态快照→关键决策→剩余任务
输出: 交接文档
```

### 建议3: 优化Core（保持228词，调整内容）

**当前Core的问题**:
- 有些规则过于具体（如"avoid broad parent searches"）
- 缺少对现代模型能力的利用

**建议调整**:

```markdown
# Engineering Core (228 words → 保持)

Project instructions and current request take precedence.

**Discover**
- Inspect repository efficiently: status, instructions, relevant code/tests/callers
- Search across files when ownership unclear; preserve unrelated work
- Read design docs; identify authoritative sources

**Align**
- Confirm goal, acceptance, scope, assumptions
- Ask only about material branches: behavior, interfaces, data, permissions, security, compatibility
- Infer reversible implementation choices from repository patterns

**Choose Boundaries**
- Find existing domain behavior
- Fix shared root causes; check sibling callers
- Place rules with owning modules

**Implement Maintainably**
- Prefer: familiar, explicit, local, debuggable code (not minimum lines)
- Novelty (dense syntax, hidden effects, metaprogramming, abstractions, patterns) requires concrete benefit
- Reuse only identical semantics evolving together; avoid speculative extensions
- Preserve: validation, permissions, security, data integrity, compatibility, accessibility

**Verify Feedback**
- Check review feedback against code, requirements, conventions before applying

**Test Strategically**
- Regressions/high-risk: observe focused failure first (when stable seam exists)
- Otherwise: focused tests OR smallest meaningful compile/lint/integration check
- Avoid ceremonial tests of implementation details

**Complete Evidence-Based**
- Run fresh scope-appropriate verification
- Remove diagnostics; report gaps
- Reconcile docs without rewriting requirements
- Update project instructions only for durable cross-task rules

**Preserve Boundaries**
- No commit, push, merge, publish, issues, installs, or global config without authorization
```

---

## 📊 优化对比表

| 维度 | 当前（7 workflows） | 优化后（5 workflows） | 改进 |
|-----|-------------------|---------------------|------|
| **Workflow数量** | 7 | 5 | -29% ✅ |
| **功能重叠** | clarify/develop confirm 90%重叠 | 合并消除 | ✅ |
| **边界测试** | 无系统化方法 | 独立workflow | +能力 ✅ |
| **用户困惑** | "先讨论用clarify还是develop?" | develop confirm统一 | -困惑 ✅ |
| **内部细节暴露** | verify-and-reconcile可见 | 合并到develop内部 | +封装 ✅ |
| **Core复杂度** | 228词，略保守 | 228词，更现代 | +能力 ✅ |

---

## 🎯 最终推荐架构

### 核心设计

```
轻量Core（228词）
  ↓ 自动加载到每个会话
  
5个显式Workflows（用户token触发）
  1. develop [confirm]    - 端到端开发
  2. diagnose             - 问题诊断
  3. code-design          - 设计评估
  4. review               - 第三方审查
  5. boundary-test        - 边界测试（新增）
  6. handoff              - 交接记录
```

### 用户决策树

```
我该用哪个？

├─ 要开发功能？
│   ├─ 需求清晰 → develop
│   └─ 需求模糊 → develop confirm
│
├─ 有bug要修？ → diagnose
│
├─ 设计不确定？ → code-design
│
├─ 功能完成，想审查？ → review
│
├─ 测试边界情况？ → boundary-test
│
└─ 今天做不完？ → handoff
```

---

## 🚀 实施路径

### 阶段1: 合并重叠（1-2天）

1. **移除 clarify workflow**
   - [ ] 删除 `skills/clarify/SKILL.md`
   - [ ] 更新 `develop` 的 confirm 模式说明
   - [ ] 更新 README 的场景表

2. **合并 verify-and-reconcile 到 develop**
   - [ ] 删除 `skills/verify-and-reconcile/SKILL.md`
   - [ ] 在 develop step 7 展开验证逻辑
   - [ ] 添加自动判断"是否需要深度验证"

### 阶段2: 新增能力（2-3天）

3. **创建 boundary-test workflow**
   - [ ] 编写 `skills/boundary-test/SKILL.md`
   - [ ] 5类边界测试矩阵
   - [ ] 与TDD的协作说明
   - [ ] 测试用例

### 阶段3: 优化Core（1天）

4. **更新 hooks/core.md**
   - [ ] 放宽"avoid broad searches"限制
   - [ ] 强化"behaviorally sensitive tests"
   - [ ] 保持228词限制

### 阶段4: 文档更新（1天）

5. **更新文档**
   - [ ] README 场景表
   - [ ] 决策树图
   - [ ] 更新安装说明

**总计**: 5-7天

---

## ⚠️ 风险与注意事项

### 风险1: 移除clarify的用户反弹

**缓解**:
- 保留`develop confirm`别名支持`$engineering-flow:clarify`
- 渐进弃用警告（3个月）
- 迁移指南

### 风险2: boundary-test增加复杂度

**缓解**:
- 定位为"可选增强"，非强制
- 提供清晰的"何时使用"指南
- 示例驱动文档

---

## 📝 关键结论

### 您已经做对的（保持）⭐⭐⭐

1. **轻量Core + 显式Workflows** - 完美避免了superpowers的"流程太重"
2. **只问关键问题** - 完美避免了grell-docs的"几百个问题"
3. **质量优于行数** - 完美避免了ponytail的"为了少而少"
4. **现代模型适配** - 正确利用推理能力

### 可以进一步优化的

1. **合并重叠**: clarify ≈ develop confirm（-1个workflow）
2. **内部化细节**: verify-and-reconcile作为develop内部步骤（-1个workflow）
3. **补充能力**: 新增boundary-test（+1个workflow）
4. **现代化Core**: 放宽过度保守的限制（保持228词）

### 最终方案: 7 → 6 Workflows

```
删除: clarify, verify-and-reconcile  (-2)
新增: boundary-test                  (+1)
净减: 1个workflow                    (-14%)
功能: 更完整（+边界测试能力）
```

---

**文档版本**: v2.0  
**创建日期**: 2026-07-25  
**基于**: 您的实际项目（非baseline）