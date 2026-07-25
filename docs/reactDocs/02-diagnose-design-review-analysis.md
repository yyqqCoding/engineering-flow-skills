# 当前架构深度分析（第2部分：诊断与设计）

## 深度分析：diagnose（50行）

### 职责范围
```
定位症状与信号 → 复现、最小化、定位所有权 → 
测试假设 → 仅在请求时修复 → 清理并完成
```

### 关键设计特点

**特点1: 诊断与修复分离**
```markdown
第9行: "Diagnosis is read-only unless the user 
        also asked for a fix."

设计优势:
  ✅ 默认只诊断，不修改代码
  ✅ 用户明确要求时才修复
  ✅ 避免"边诊断边修改"的混乱
```

**特点2: 强调最小复现**
```markdown
第22-24行:
"- Observe the failure.
 - Remove inputs, steps, dependencies, and 
   callers one at a time while preserving it.
 - Follow data and control flow across boundaries."

这是标准的 Root Cause Analysis 方法
→ 比 superpowers 的 systematic-debugging 更简洁
→ 但核心思想一致（根因优先）
```

**特点3: 有条件的回归测试**
```markdown
第38行:
"Turn the minimized reproduction into a 
regression test when a correct public seam exists."

第43行:
"When no correct regression seam exists, document 
that architectural limitation rather than adding 
a misleading test."

设计优势:
  ✅ 不强制要求测试（当没有好的seam时）
  ✅ 避免为了测试而测试
  ✅ 诚实报告架构限制
```

### 与 develop 的关系

**develop 步骤1 中的路由逻辑**:
```markdown
第24行:
"Determine whether the request is implementation, 
diagnosis, review, or documentation work. Route 
a bug through `diagnose`; do not duplicate its 
process here."

设计意图:
  develop 识别到是 bug → 路由到 diagnose
  develop 不重复 diagnose 的逻辑
```

**依赖关系**:
```json
"develop": {
  "dependencies": ["diagnose", ...]
}

"diagnose": {
  "dependencies": ["verify-and-reconcile"]
}
```

**问题识别**:
```
diagnose 也依赖 verify-and-reconcile
→ 与 develop 相同的依赖模式
→ 再次证明 verify-and-reconcile 的"基础设施"角色

疑问: diagnose 的修复是否也需要完整的 verify？
→ 技能描述第50行说:
  "Use verify-and-reconcile only when the change 
   also affects multiple acceptance criteria..."
  
→ 这意味着 diagnose 的修复通常不需要 verify
→ 但依赖关系却定义了依赖
→ 矛盾
```

### 优化方向

**当前设计的优点**（保持）:
- ✅ 诊断与修复分离
- ✅ 最小复现方法
- ✅ 务实的测试策略

**可优化点**:
- ⚠️ 与 verify-and-reconcile 的依赖关系不清晰
- ⚠️ 修复后的验证流程未明确说明

---

## 深度分析：code-design（87行）

### 职责范围
```
建立本地语言 → 映射设计压力 → 偏好可维护表达 → 
应用新颖性税 → 按语义复用和抽象 → 仅在真实压力下使用模式
```

### 核心设计哲学

**哲学1: 最低必要复杂度**
```markdown
第9行:
"Choose the lowest necessary complexity that 
keeps behavior clear, local, testable, and 
easy to change. Do not optimize for line count 
or the appearance of sophistication."

这直接针对 ponytail 的"为了少而少"问题
→ 明确反对"代码行数"作为质量指标
```

**哲学2: 压力驱动的抽象**
```markdown
第19-30行:
"Name the actual problem before choosing a technique:
- Hard-to-follow control flow
- Hidden mutation, I/O, errors, or state transitions
- Semantic duplication that should change together
- Similar-looking rules that should remain independent
- Repeated conditionals along one real variation axis
- An unstable external dependency
- Scattered ownership of one invariant
- Construction or lifecycle rules with real combinations
- A missing stable public seam

No observed pressure means no new abstraction."

设计优势:
  ✅ 列举了9种具体的"压力"场景
  ✅ 没有压力 = 不抽象（反对过度设计）
  ✅ 这是 Domain-Driven Design 的核心思想
```

**哲语3: 新颖性税（Novelty Tax）**
```markdown
第50-52行:
"An uncommon construct, reflection, metaprogramming, 
dense expression, implicit runtime behavior, new 
dependency, abstraction, or design pattern must 
provide a concrete benefit in correctness, measured 
performance, framework alignment, or total 
maintenance cost."

这是最重要的设计原则之一
→ 任何"非常规"代码必须证明其价值
→ 避免"炫技"式编程
```

### 与 grell-docs 的关联

**您提到**: "grell-docs 被人说每次问几百个问题"

**code-design 如何避免**:
```markdown
第69行:
"Do not ask the user to design internal classes, 
methods, or patterns."

→ 明确禁止问"内部设计"问题
→ 设计决策由 AI 自主完成
→ 只有"业务语义"需要用户确认
```

### 实际使用场景分析

**场景1: 您提到的"从0的项目"**
```
用户: "设计一个新的通知系统"

code-design 流程:
1. 建立本地语言 → 检查现有项目的通知模式
2. 映射设计压力 → 识别多渠道、多格式的变化轴
3. 偏好可维护   → 避免复杂的 Builder 模式
4. 应用新颖性税 → 评估 Strategy 模式是否值得
5. 按语义复用   → 检查现有的消息队列模式
6. 仅在真实压力 → 当前只有邮件和短信 → 暂不抽象

输出: 具体的模块边界设计 + 权衡分析
```

**场景2: 您提到的"逻辑不严密的设计文档"**
```
用户: "这是我的设计文档（附件），帮我完善"

code-design 流程:
1. 读取文档
2. 识别设计压力（文档中提到的变化点）
3. 检查是否有"过度设计"或"设计不足"
4. 提出改进建议
5. 输出改进后的设计

关键: code-design 既能评审也能设计
→ 适合"完善现有设计"场景
```

### 与其他 skills 的关系

**依赖关系**:
```json
"code-design": {
  "invocation": "user",
  "dependencies": []
}

"develop": {
  "dependencies": [..., "code-design"]
}

"review": {
  "dependencies": ["code-design"]
}
```

**分析**:
- code-design 无依赖 → 可独立使用
- develop 和 review 都可能用到它
- 这符合"设计评估"的定位

### 优化方向

**当前设计的优点**（保持）:
- ✅ 压力驱动的抽象哲学（非常好）
- ✅ 新颖性税原则（避免炫技）
- ✅ 9种具体压力场景（可操作）
- ✅ 无依赖（独立性好）

**可优化点**:
- ⚠️ 87行较长，但内容都有价值
- ⚠️ 与 develop 的调用关系可以更明确
- ✅ 建议：保持现状，这个技能设计得很好

---

## 深度分析：review（53行）

### 职责范围
```
定义比较 → 恢复意图 → 审查独立轴 → 报告发现
```

### 8个审查维度

```markdown
第33-40行列出的维度:
1. Requirements  - 需求符合性
2. Correctness   - 正确性（边界、失败、并发）
3. Safety        - 安全性（权限、数据、兼容性）
4. Design        - 设计质量（所有权、复用、抽象成本）
5. Readability   - 可读性（显式流程、命名、局部推理）
6. Tests         - 测试质量（是否测试公共行为）
7. Documentation - 文档（是否过期、是否篡改需求）
8. Scope         - 范围（无关编辑、临时代码）
```

**对比 superpowers 的 requesting-code-review**:
```
superpowers: 没有明确的维度列表
engineering-flow: 8个清晰的独立维度

优势: 结构化、可检查、不遗漏
```

### 只读原则

```markdown
第10行:
"Perform an evidence-backed, read-only review. 
Do not edit files, commit, or push."

设计优势:
  ✅ 明确定位为"审查"，不混入"修复"
  ✅ 避免"边审查边改"的混乱
  ✅ 输出是"问题清单"，不是"修改后的代码"
```

### 依赖关系

```json
"review": {
  "dependencies": ["code-design"]
}
```

**分析**:
```
review 依赖 code-design
→ 审查"设计质量"维度时，参考 code-design 的标准

第42行:
"Use `code-design` as the design/readability 
reference when needed."

→ 明确说明了依赖关系的用途
→ code-design 是"设计标准"
→ review 是"应用标准进行检查"
```

### 与 develop 的关系

**develop 步骤6 "Review"**:
```markdown
第74-82行:
"Re-read the accepted behavior and inspect the 
diff from a fixed point. Check:
- Missing, incorrect, or extra behavior
- Error and boundary behavior
- Security, permissions, data, compatibility
- Ownership, reuse, readability, abstraction cost
- Test sensitivity and maintenance cost
- Unrelated changes and temporary artifacts

Use a separate `review` invocation only when 
the user asks for a formal read-only review. 
An implementation self-check remains part of 
this workflow."

关键发现:
  develop 有内置的 self-review（步骤6）
  独立的 review skill 用于"正式审查"
  
区别:
  self-review: 实施者自查，发现问题立即修复
  formal review: 第三方审查，只读输出问题清单
```

### 优化方向

**当前设计的优点**（保持）:
- ✅ 8个独立维度（结构清晰）
- ✅ 只读原则（职责单一）
- ✅ 与 code-design 的依赖关系明确
- ✅ 与 develop self-review 的区分清晰

**可优化点**:
- ✅ 这个技能设计得很好，建议保持现状
