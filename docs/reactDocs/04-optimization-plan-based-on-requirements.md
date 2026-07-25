# 深度优化方案（第4部分：基于您的需求）

## 您的明确需求重述

根据您的澄清，您需要的架构是：

```
1. develop          - 开发（包含问题澄清、方案澄清、grell-docs式提问）
2. code-design      - 设计（0起步项目、完善现有设计文档）
3. diagnose         - 诊断（找问题、修bug）
4. 代码优化部分      - （当前缺失）
5. boundary-test    - 边界测试（当前缺失）
6. handoff          - 交接文档
```

### 需求1: develop = 澄清 + 实施

**您的期望**:
```
develop 应该包含:
  - 问题的澄清（业务需求澄清）
  - 方案澄清（技术方案澄清）
  - grell-docs 式的提问思想
  - 然后实施
```

**当前 develop 的状态**:
```
develop 已经有:
  ✅ 步骤1: Discover（发现）
  ✅ 步骤2: Align（对齐需求）
  ✅ confirm 模式（先澄清再实施）
  
develop 缺少:
  ❌ 明确的"grell-docs 式提问"指导
  ❌ 方案澄清的独立阶段
```

**grell-docs 的提问思想是什么？**

根据 baseline/skills (mattpocock) 的设计：
```
grell-docs 的核心:
  - 系统化的需求澄清
  - 结构化的问题清单
  - 逐步深入的探索
  
被批评的点:
  - 问题太多（几百个）
  - 过度细节化
  
精华部分:
  - 结构化思考（不遗漏）
  - 分层提问（先主干后细节）
```

**如何融合到 develop？**
```
当前 develop 第2步 Align:
  "Ask only questions whose answers materially 
   change behavior, interfaces, data semantics..."

改进后 develop 第2步 Align:
  添加子步骤:
    2.1 业务层澄清（用户目标、验收标准）
    2.2 接口层澄清（数据结构、API契约）
    2.3 技术层澄清（性能要求、安全约束）
  
  提问策略:
    - 使用结构化问题清单（借鉴grell-docs）
    - 但过滤掉非关键问题（避免几百个问题）
    - 采用"materially changing"过滤器
```

### 需求2: code-design = 设计与完善

**您的期望**:
```
code-design 应该支持:
  1. 完全从0的项目（新设计）
  2. 用户已有设计文档，但逻辑不严密（完善设计）
```

**当前 code-design 的状态**:
```
code-design 已经支持:
  ✅ 场景1: 评估现有代码的设计（第1步：Establish local language）
  ✅ 场景2: 识别设计压力（第2步：Map design pressure）
  ✅ 场景3: 提出设计建议（第3-6步）
  
code-design 缺少:
  ❌ 明确的"从0开始"流程
  ❌ "完善现有设计文档"的专门流程
```

**如何增强 code-design？**
```
添加模式识别:

模式A: 从0开始（Greenfield Design）
  触发条件: 无现有代码，无现有设计文档
  流程:
    1. 理解业务需求
    2. 识别核心实体和关系
    3. 设计模块边界
    4. 定义接口契约
    5. 选择技术栈
    6. 输出设计文档

模式B: 评估现有代码（Code Assessment）
  触发条件: 有代码，需要评估设计质量
  流程: 当前的 code-design 流程

模式C: 完善设计文档（Design Refinement）
  触发条件: 有设计文档，但逻辑不严密
  流程:
    1. 读取设计文档
    2. 识别逻辑漏洞（缺失流程、矛盾、模糊）
    3. 补充缺失部分
    4. 解决矛盾
    5. 明确模糊点
    6. 输出改进版设计文档
```

### 需求3: 代码优化部分（当前缺失）

**您的期望**:
```
一个专门的"代码优化" workflow
```

**当前状态**:
```
没有独立的"代码优化" skill
相关概念分散在:
  - develop 步骤4: 选择反馈（包含重构）
  - code-design: 评估设计质量
  - review: 审查可读性和设计
```

**是否需要独立的 optimize/refactor skill？**

**分析**:
```
支持独立 optimize skill 的理由:
  ✅ 明确的用户需求（"优化这段代码"）
  ✅ 与新功能开发分离（不同的心智模式）
  ✅ 特定的安全检查（确保行为不变）
  
反对独立 optimize skill 的理由:
  ❌ 与 code-design 重叠（都是改进设计）
  ❌ 优化应该在 develop 的 refactor 阶段
  ❌ 增加技能数量
```

**推荐方案: 创建独立的 optimize skill**

理由:
```
1. 用户有明确需求
2. 与 develop 的定位不同:
   - develop: 实现新功能（顺带重构）
   - optimize: 专门优化现有代码（不加功能）
3. 与 code-design 的定位不同:
   - code-design: 评估和建议
   - optimize: 实际执行优化
```

**optimize skill 的设计**:
```yaml
---
name: optimize
description: Optimize existing code for readability, 
             performance, or maintainability without 
             changing behavior
---

# Optimize

Improve existing code quality while preserving 
exact behavior.

## 1. Identify optimization target
- Performance bottleneck
- Readability issues
- Maintainability problems
- Code duplication
- Over-abstraction

## 2. Establish behavior baseline
- Run existing tests
- Document current behavior
- Identify test gaps

## 3. Apply optimizations
- Performance: Profile-guided optimization
- Readability: Extract methods, improve naming
- Maintainability: Remove duplication, simplify
- Design: Reduce coupling, improve cohesion

## 4. Verify behavior preservation
- All tests still pass
- No new warnings
- Performance metrics (if applicable)
- Manual verification of edge cases

## 5. Safety constraints
- Never change public interfaces
- Never alter observable behavior
- Never optimize without tests
- Never optimize without profiling (for performance)
```

### 需求4: boundary-test（新增）

**您的期望**:
```
极端测试用例，测试边界情况
```

**设计已在之前的分析中完成**，这里补充与其他 skills 的集成：

**boundary-test 的定位**:
```
使用时机:
  - develop 完成后（功能已实现并通过 TDD）
  - optimize 完成后（代码已优化）
  - 安全敏感模块
  
与 develop 的关系:
  develop: TDD 覆盖 happy path + 已知错误路径
  boundary-test: 覆盖未预期的边界和攻击场景
  
与 diagnose 的关系:
  diagnose: 已发生的 bug
  boundary-test: 预防未来的 bug
```

**boundary-test 应该被谁依赖？**
```
选项A: develop 依赖 boundary-test
  develop 完成后自动触发 boundary-test
  
选项B: boundary-test 独立
  用户手动调用（$engineering-flow:boundary-test）
  
推荐: 选项B
  理由:
    - 不是所有代码都需要边界测试
    - 边界测试相对耗时
    - 用户应该决定何时执行
```

---

## 优化后的架构设计

### 最终技能清单（6个）

```
1. develop              - 端到端开发（含澄清）
2. code-design          - 设计（3种模式）
3. diagnose             - 诊断修复
4. optimize             - 代码优化（新增）
5. boundary-test        - 边界测试（新增）
6. handoff              - 交接文档
```

### 删除的技能（2个）

```
❌ clarify              - 功能被 develop 吸收
❌ verify-and-reconcile - 内部化到 develop 和 diagnose
❌ review               - 功能被 develop self-review 和 optimize 覆盖
```

**review 为什么删除？**
```
review 的 8 个维度:
  1. Requirements     → develop 步骤2 Align 检查
  2. Correctness      → develop 步骤5 实施时保证
  3. Safety           → develop 步骤5 和 Core 保证
  4. Design           → code-design 评估
  5. Readability      → code-design 和 optimize 改进
  6. Tests            → develop 步骤4 选择反馈
  7. Documentation    → develop 步骤7 完成时对账
  8. Scope            → develop 步骤6 自审时检查

分析:
  review 的所有维度都被其他技能覆盖
  review 的定位是"第三方审查"
  但在 AI 辅助开发中，develop 自带高质量自审
  
保留 review 的理由:
  - 审查别人的 PR
  
删除 review 的理由:
  - develop 自审已经很严格
  - 用户可以自己看 diff
  - 减少技能数量
  
决策: 删除
  如果未来需要"审查别人 PR"的场景，可以恢复
```

### 优化后的依赖关系

```
develop
  └── code-design (可选，当需要设计评估时)

code-design
  (无依赖)

diagnose
  (无依赖)

optimize
  └── code-design (参考设计标准)

boundary-test
  (无依赖)

handoff
  (无依赖)
```

**依赖关系简化**:
```
当前: 最多3层依赖（develop → diagnose → verify-and-reconcile）
优化后: 最多2层依赖（develop → code-design）
        且大部分技能无依赖
```

---

## 与参考项目的对比

### vs superpowers (14 skills)

```
superpowers 的问题:
  ❌ 流程太重（每句话都触发完整流程）
  ❌ 技能数量多（14个）
  ❌ 强制 TDD、强制计划文档

engineering-flow 的改进:
  ✅ 轻量 Core（228词）
  ✅ 显式触发（$engineering-flow:xxx）
  ✅ 技能数量少（6个）
  ✅ 务实的测试策略（不强制 TDD）
```

### vs grell-docs (mattpocock/skills)

```
grell-docs 的问题:
  ❌ 问题太多（几百个）
  ❌ 过度细节化
  ❌ 用户体验差

engineering-flow 的改进:
  ✅ "materially changing" 过滤器
  ✅ 借鉴结构化提问思想
  ✅ 但限制问题数量
  
优化后 develop 会:
  ✅ 使用 grell-docs 的结构化方法
  ✅ 但应用 "materially changing" 过滤
  ✅ 最多 5-10 个问题（不是几百个）
```

### vs ponytail

```
ponytail 的问题:
  ❌ 为了少而少
  ❌ 用代码行数衡量质量

engineering-flow 的改进:
  ✅ code-design 明确: "不优化行数"
  ✅ Core 明确: "可维护性 > 行数"
  ✅ 新颖性税原则（反对炫技）
```
