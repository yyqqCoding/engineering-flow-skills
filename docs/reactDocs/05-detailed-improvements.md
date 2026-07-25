# 详细实施方案（第5部分：具体改进内容）

## 改进1: 增强 develop（融合 clarify + grell-docs 思想）

### 当前 develop 的问题

```
步骤2 Align 太简单:
  - 只有1段描述（10行）
  - 没有结构化的澄清流程
  - 缺少 grell-docs 的系统化思维
```

### 改进后的 develop 步骤2: Align

```markdown
## 2. Align Requirements

### 2.1 Structure the ambiguity space

Use a systematic framework to ensure nothing critical 
is missed. Check each dimension but ask ONLY when the 
answer would materially change the implementation:

**Business Layer:**
- Goal: What success looks like (NOT how to implement)
- Actors: Who uses this, what permissions
- Acceptance criteria: How to verify success
- Out of scope: What we explicitly won't do

**Interface Layer:**
- User-visible behavior: What users see/do
- Data contracts: Input/output formats, validation rules
- Error behavior: What happens when things go wrong
- Edge cases: Empty, null, duplicate, concurrent scenarios

**Technical Layer:**
- Performance: Response time, throughput requirements
- Security: Authentication, authorization, data protection
- Compatibility: Breaking changes, migration needs
- Dependencies: External systems, libraries, services

### 2.2 Filter questions with "materially changing" test

Before asking any question, verify:
- Does this answer change behavior? (YES → ask)
- Does this answer change interfaces? (YES → ask)
- Does this answer change data semantics? (YES → ask)
- Does this answer change security? (YES → ask)
- Can repository evidence resolve this? (YES → don't ask)
- Is this a reversible implementation detail? (YES → don't ask)

**Target: 5-10 questions maximum, NOT hundreds**

### 2.3 Ask efficiently

- Batch independent questions together
- Ask dependent questions in sequence
- Provide recommended answer when evidence supports it
- State assumptions clearly for user confirmation

### 2.4 Produce checkpoint

**In normal mode:**
Present brief checkpoint, wait only for blocking ambiguities.

**In confirm mode:**
Present full checkpoint with:
- Goal and acceptance behavior
- Out of scope
- Assumptions derived from repository
- Blocking ambiguities
- Proposed implementation approach

Wait for explicit approval before proceeding.

### 2.5 Document aligned requirements

If this is complex work or user requests documentation:
- Update existing design doc with confirmed decisions
- OR create brief implementation agreement
- Keep it concise (1-2 pages max)
- Focus on "what" not "how"

Do NOT silently create docs for simple tasks.
```

### 关键改进点

**改进1: 结构化的澄清框架**
```
借鉴 grell-docs:
  ✅ 3层结构（业务、接口、技术）
  ✅ 系统化检查（不遗漏）
  
避免 grell-docs 问题:
  ✅ "materially changing" 过滤器
  ✅ 目标 5-10 个问题（而非几百个）
```

**改进2: 明确的过滤标准**
```
7个过滤规则:
  1. 改变行为？ → 问
  2. 改变接口？ → 问
  3. 改变数据语义？ → 问
  4. 改变安全？ → 问
  5. 仓库能解决？ → 不问
  6. 可逆的实现细节？ → 不问
  7. 可以推断的？ → 不问
```

**改进3: 文档策略清晰**
```
简单任务: 不创建文档
复杂任务: 简要文档（1-2页）
不是所有任务都需要设计文档
```

---

## 改进2: 增强 code-design（支持3种模式）

### 当前 code-design 的问题

```
只支持"评估现有代码"场景
不支持"从0开始"和"完善设计文档"场景
```

### 改进后的 code-design

```markdown
---
name: code-design
description: Design from scratch, refine existing 
             design docs, or evaluate code design quality
---

# Code Design

Choose the lowest necessary complexity that keeps 
behavior clear, local, testable, and easy to change.

## Mode Detection

Automatically detect which mode to use based on context:

**Mode A: Greenfield Design (从0开始)**
- Trigger: No existing code, no design doc mentioned
- User says: "设计一个新的X系统"
- Flow: Business → Entities → Boundaries → Interfaces

**Mode B: Design Refinement (完善设计文档)**
- Trigger: User provides or references existing design doc
- User says: "这是我的设计文档，帮我完善"
- Flow: Read → Analyze → Identify gaps → Refine

**Mode C: Code Assessment (评估现有代码)**
- Trigger: Existing code exists, need design evaluation
- User says: "评估这段代码的设计"
- Flow: Current flow (unchanged)

---

## Mode A: Greenfield Design

### 1. Understand business domain
- Core business entities and their relationships
- Key business rules and invariants
- Expected change patterns
- Non-functional requirements (scale, performance, security)

### 2. Design module boundaries
- Apply Single Responsibility Principle
- Identify bounded contexts (DDD)
- Define module interfaces
- Plan dependency directions

### 3. Design data model
- Entity schemas
- Relationships and cardinality
- Data lifecycle and ownership
- Migration strategy

### 4. Choose technology stack
- Language and framework (match existing project)
- Database and storage
- External dependencies
- Justify non-standard choices

### 5. Output design document
Create structured design document:
```
# [System Name] Design

## Overview
- Purpose and scope
- Key stakeholders

## Architecture
- Module diagram
- Component responsibilities
- Dependency graph

## Data Model
- Entity schemas
- Relationships

## Key Design Decisions
- What was decided
- Why (trade-offs)
- Alternatives considered

## Implementation Phases
- Phase 1: Core entities
- Phase 2: Business logic
- Phase 3: Integration
```

---

## Mode B: Design Refinement

### 1. Read existing design document
- Understand intended design
- Note assumptions and decisions
- Identify scope and out-of-scope

### 2. Analyze for completeness
Check for missing elements:
- ❓ Are all user stories covered?
- ❓ Are error scenarios defined?
- ❓ Are edge cases addressed?
- ❓ Are interfaces fully specified?
- ❓ Are dependencies identified?
- ❓ Is data lifecycle clear?
- ❓ Are security requirements stated?

### 3. Analyze for consistency
Check for contradictions:
- ❓ Do different sections conflict?
- ❓ Are examples consistent with rules?
- ❓ Are diagrams consistent with text?
- ❓ Are assumptions compatible?

### 4. Analyze for clarity
Check for ambiguity:
- ❓ Are terms well-defined?
- ❓ Are decisions justified?
- ❓ Are boundaries clear?
- ❓ Are responsibilities explicit?

### 5. Propose improvements
For each issue found:
- State the problem clearly
- Explain why it matters
- Propose concrete fix
- Show before/after if needed

### 6. Output refined design
Update the document with:
- Filled gaps
- Resolved contradictions
- Clarified ambiguities
- Added missing justifications

Mark changes clearly (e.g., with date and "Added: ...")

---

## Mode C: Code Assessment

(Keep current flow unchanged - it's already good)

---

## Cross-Mode Principles

All modes follow these principles:

### 1. Establish local language
(current content, unchanged)

### 2. Map design pressure
(current content, unchanged)

### 3. Prefer maintainable expression
(current content, unchanged)

### 4. Apply novelty tax
(current content, unchanged)

### 5. Reuse by semantics
(current content, unchanged)

### 6. Use patterns under real pressure
(current content, unchanged)

---

## Output Format

**For Mode A (Greenfield):**
Return: Complete design document

**For Mode B (Refinement):**
Return: Refined design document + change summary

**For Mode C (Assessment):**
Return: Design evaluation report + recommendations
```

### 关键改进点

**改进1: 3种模式自动识别**
```
用户不需要指定模式
AI 根据上下文自动识别:
  - 无代码无文档 → Mode A
  - 有文档需完善 → Mode B
  - 有代码需评估 → Mode C
```

**改进2: Mode A（从0开始）完整流程**
```
业务理解 → 模块边界 → 数据模型 → 
技术栈选择 → 输出设计文档

包含具体的设计文档模板
适合您提到的"完全从0的项目"
```

**改进3: Mode B（完善设计文档）结构化分析**
```
3个维度:
  - 完整性（缺失什么？）
  - 一致性（矛盾在哪？）
  - 清晰性（模糊在哪？）

适合您提到的"逻辑不严密的设计文档"
```

---

## 改进3: 创建 optimize skill（新增）

### 设计原则

```
optimize 与 develop 的区别:
  develop: 实现新功能（可能顺带重构）
  optimize: 专门优化现有代码（不加功能）

optimize 与 code-design 的区别:
  code-design: 评估和建议（只读）
  optimize: 实际执行优化（修改代码）
```

### optimize skill 完整定义

```markdown
---
name: optimize
description: Improve code quality (readability, 
             performance, maintainability) without 
             changing observable behavior
---

# Optimize

Refactor existing code to improve quality while 
preserving exact behavior.

## When to use

- Code works but is hard to understand
- Performance bottlenecks identified
- Code duplication across modules
- Over-engineered abstractions
- Under-engineered (missing abstractions under real pressure)

## When NOT to use

- Code doesn't work correctly → use `diagnose`
- Need to add new features → use `develop`
- Need design evaluation only → use `code-design`

---

## Process

### 1. Establish behavior baseline

**Critical: Must have tests before optimizing**

- Run existing test suite
- Record test coverage for target code
- If coverage gaps exist, add characterization tests
- Document current behavior (inputs → outputs)

**Red flag:** No tests for the code being optimized
**Action:** Write characterization tests first

### 2. Identify optimization target

Choose ONE dimension per optimization cycle:

**Performance:**
- Profile first (never guess)
- Identify actual bottleneck (measurement, not intuition)
- Set target metrics (e.g., "reduce from 500ms to 100ms")

**Readability:**
- Complex control flow
- Poor naming
- Missing intent-revealing names
- Hidden side effects
- Large functions (>50 lines)

**Maintainability:**
- Code duplication (semantic, not syntactic)
- High coupling
- Low cohesion
- Missing abstractions under real pressure
- Unnecessary abstractions (speculative)

**Design:**
- Scattered ownership
- Leaky abstractions
- Violated design principles

### 3. Choose optimization strategy

**For Performance:**
- Algorithm improvement (O(n²) → O(n log n))
- Caching (memoization, query results)
- Lazy evaluation
- Batch operations
- Parallel processing (where safe)

**For Readability:**
- Extract method (long function → small focused functions)
- Rename (unclear → domain-meaningful names)
- Simplify conditionals (nested → flat, complex → simple)
- Make implicit explicit (hidden effects → visible)

**For Maintainability:**
- Remove duplication (DRY - Don't Repeat Yourself)
- Reduce coupling (dependency injection, interfaces)
- Increase cohesion (related things together)
- Introduce abstraction (under real pressure only)

**For Design:**
- Move behavior to owning module
- Extract interface
- Apply design pattern (only if reduces complexity)

### 4. Execute optimization

**One change at a time:**
- Make smallest logical improvement
- Run tests after EACH change
- If tests fail: revert immediately, understand why
- If tests pass: commit before next optimization

**Never batch changes:**
❌ Bad: Fix naming + extract methods + optimize algorithm
✅ Good: Fix naming → commit → extract methods → commit → ...

### 5. Verify behavior preservation

**Must verify:**
- All tests still pass (no new failures)
- No new compiler/linter warnings
- Performance metrics maintained or improved (if applicable)
- Edge cases still handled correctly

**For performance optimizations, also verify:**
- Run performance benchmark
- Compare before/after metrics
- Ensure improvement meets target
- Check for regressions in other areas

### 6. Review against quality principles

Use `code-design` principles as reference:

- Is code more familiar/idiomatic?
- Is control flow more explicit?
- Is local reasoning easier?
- Are names more meaningful?
- Is code more debuggable?
- Is change resilience improved?

### 7. Clean up and document

**Clean up:**
- Remove dead code introduced during optimization
- Remove temporary profiling/debugging code
- Ensure consistent formatting

**Document (when needed):**
- Performance: Benchmark results (before/after)
- Complexity: Why refactoring was needed
- Design: Architectural decisions made

**Don't document:**
- Obvious refactorings (rename, extract method)
- Standard patterns (everyone knows what Factory does)

---

## Safety Constraints

### Never change:
❌ Public interfaces (APIs, function signatures)
❌ Observable behavior (same inputs → same outputs)
❌ Error handling behavior
❌ Side effects (database, files, network)
❌ Thread safety properties

### Always verify:
✅ Tests pass after EACH change
✅ No new warnings
✅ Performance maintained (unless that's the optimization)
✅ Edge cases still work

### Never optimize:
❌ Without tests
❌ Without profiling (for performance)
❌ Multiple things at once
❌ Based on "I think this is better"

---

## Common Optimizations

### Extract Method
```python
# Before
def process_order(order):
    # 50 lines of validation
    # 30 lines of calculation
    # 20 lines of database update
    pass

# After
def process_order(order):
    validate_order(order)
    total = calculate_order_total(order)
    update_order_in_database(order, total)
```

### Reduce Duplication
```python
# Before (semantic duplication)
def create_user(name, email):
    if not email or '@' not in email:
        raise ValueError("Invalid email")
    # ... create user

def update_user(user_id, email):
    if not email or '@' not in email:
        raise ValueError("Invalid email")
    # ... update user

# After
def validate_email(email):
    if not email or '@' not in email:
        raise ValueError("Invalid email")

def create_user(name, email):
    validate_email(email)
    # ... create user

def update_user(user_id, email):
    validate_email(email)
    # ... update user
```

### Simplify Conditionals
```python
# Before (nested)
def get_discount(user, order):
    if user:
        if user.is_premium:
            if order.total > 100:
                return 0.2
            else:
                return 0.1
        else:
            return 0
    else:
        return 0

# After (early return)
def get_discount(user, order):
    if not user:
        return 0
    if not user.is_premium:
        return 0
    if order.total > 100:
        return 0.2
    return 0.1
```

---

## Red Flags During Optimization

Stop and reconsider if:

❌ Tests started failing and you "fixed the tests"
   → Tests were correct, your optimization broke behavior

❌ You added dependencies to "make it better"
   → Novelty tax not justified

❌ You introduced complex patterns "for future flexibility"
   → Speculative design, no real pressure

❌ You're optimizing based on feel, not measurement
   → Profile first for performance

❌ You've been optimizing for >2 hours
   → Break into smaller tasks, commit intermediate state

---

## Integration with other skills

**After develop:**
```
develop → (feature works, tests pass) → optimize → (code clean)
```

**After diagnose:**
```
diagnose → (bug fixed, test added) → optimize → (fix is clean)
```

**Use code-design for guidance:**
```
optimize references code-design principles
but optimize actually changes code
```

**Before boundary-test:**
```
optimize → (code clean) → boundary-test → (robust)
```
```

### 关键设计决策

**决策1: 行为保持不变**
```
optimize 的核心约束:
  Observable behavior 必须完全相同
  输入 → 输出 不变
  
这区别于 develop（改变行为）
```

**决策2: 必须有测试**
```
optimize 之前必须:
  1. 运行现有测试
  2. 补充 characterization tests（如果覆盖不足）
  3. 记录基线行为
  
没有测试 → 拒绝 optimize → 先写测试
```

**决策3: 一次一个改进**
```
禁止批量优化:
  ❌ 同时改命名、提取方法、优化算法
  
强制增量优化:
  ✅ 改命名 → 测试 → 提交
  ✅ 提取方法 → 测试 → 提交
  ✅ 优化算法 → 测试 → 提交
```

**决策4: 性能优化必须 profile**
```
禁止猜测:
  ❌ "我觉得这里慢"
  
强制测量:
  ✅ Profiler 指出瓶颈
  ✅ 设定目标（500ms → 100ms）
  ✅ 优化后测量确认
```
