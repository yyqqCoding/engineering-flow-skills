# 实施计划与总结（第7部分：最终）

## 实施路线图（详细）

### 阶段1: 增强现有技能（5-7天）

#### 第1-2天: 增强 develop

**任务清单**:
- [ ] 扩展步骤2 Align，添加结构化澄清框架
  - [ ] 3层结构（业务/接口/技术）
  - [ ] "materially changing" 过滤器明确化
  - [ ] 目标 5-10 个问题的指导
- [ ] 扩展步骤7 Complete，内部化验证逻辑
  - [ ] 从 verify-and-reconcile 迁移核心验证流程
  - [ ] 添加自动判断简单/复杂验证的逻辑
  - [ ] 明确文档对账策略
- [ ] 更新 develop/SKILL.md
- [ ] 测试 normal 和 confirm 两种模式

**验收标准**:
- develop 包含完整的澄清框架
- develop 包含完整的验证逻辑
- 无需调用 verify-and-reconcile
- 文档清晰，有示例

#### 第3-4天: 增强 code-design

**任务清单**:
- [ ] 添加模式检测逻辑
- [ ] 编写 Mode A: Greenfield Design 完整流程
  - [ ] 业务理解 → 模块边界 → 数据模型 → 技术栈
  - [ ] 设计文档模板
- [ ] 编写 Mode B: Design Refinement 完整流程
  - [ ] 完整性分析（缺失什么？）
  - [ ] 一致性分析（矛盾在哪？）
  - [ ] 清晰性分析（模糊在哪？）
- [ ] 保持 Mode C: Code Assessment（当前流程）
- [ ] 更新 code-design/SKILL.md

**验收标准**:
- 3种模式都有完整流程
- 模式自动识别清晰
- 每种模式都有示例
- 与 develop 的集成清晰

#### 第5天: 增强 diagnose

**任务清单**:
- [ ] 在步骤5添加内置验证逻辑
- [ ] 明确"简单修复"vs"复杂修复"的验证策略
- [ ] 移除对 verify-and-reconcile 的依赖
- [ ] 更新 diagnose/SKILL.md

**验收标准**:
- diagnose 包含必要的验证
- 不再依赖 verify-and-reconcile
- 验证策略明确

#### 第6-7天: 扩展 handoff

**任务清单**:
- [ ] 添加详细的交接文档模板
- [ ] 明确7个关键要素（目标/状态/文件/验证/任务/风险/Git）
- [ ] 添加示例
- [ ] 更新 handoff/SKILL.md

**验收标准**:
- 交接文档模板完整
- 生成的文档信息充分
- 新会话能基于交接文档继续工作

---

### 阶段2: 创建新技能（6-8天）

#### 第8-10天: 创建 optimize skill

**任务清单**:
- [ ] 编写完整的 optimize/SKILL.md（~180行）
  - [ ] 使用场景和反例
  - [ ] 7步流程（基线→目标→策略→执行→验证→审查→清理）
  - [ ] 4个优化维度（性能/可读性/可维护性/设计）
  - [ ] 安全约束（行为不变）
  - [ ] 常见优化模式示例
- [ ] 定义与 code-design 的依赖关系
- [ ] 编写测试场景

**验收标准**:
- optimize 定位清晰（vs develop, vs code-design）
- 安全约束明确（必须有测试、行为不变）
- 4个优化维度都有示例
- 与其他技能的关系清晰

#### 第11-13天: 创建 boundary-test skill

**任务清单**:
- [ ] 编写完整的 boundary-test/SKILL.md（~200行）
  - [ ] 使用场景和反例
  - [ ] 5类边界详细说明（Input/State/Resource/Data/Business）
  - [ ] 每类边界的测试用例模板
  - [ ] 3种期望行为（fail-fast/graceful/default）
  - [ ] 安全边界优先策略
- [ ] 编写多语言测试示例（Python/TypeScript/Java）
- [ ] 定义与 develop 的关系（在 TDD 之后）

**验收标准**:
- 5类边界都有详细说明
- 每类都有具体测试示例
- 安全边界（SQL注入/XSS/路径穿越）有明确示例
- 与 TDD 的区别清晰
- 多语言示例完整

#### 第14-15天: 测试新技能

**任务清单**:
- [ ] 在真实项目中测试 optimize
- [ ] 在真实项目中测试 boundary-test
- [ ] 收集反馈和问题
- [ ] 迭代改进

---

### 阶段3: 删除冗余技能（1天）

#### 第16天: 删除 clarify 和 verify-and-reconcile

**任务清单**:
- [ ] 删除 skills/clarify/SKILL.md
- [ ] 删除 skills/verify-and-reconcile/SKILL.md
- [ ] 删除 skills/review/SKILL.md（可选，见下文讨论）
- [ ] 更新 config/skills.json
  - [ ] 移除 clarify
  - [ ] 移除 verify-and-reconcile
  - [ ] 移除 review（可选）
  - [ ] 添加 optimize
  - [ ] 添加 boundary-test
  - [ ] 更新依赖关系
- [ ] 添加别名支持（可选，用于平滑迁移）
  - [ ] clarify → develop confirm
  - [ ] verify-and-reconcile → 提示已内部化

**验收标准**:
- 旧技能文件已删除
- config/skills.json 更新正确
- 依赖关系图正确
- 别名（如果实现）正常工作

---

### 阶段4: 更新基础设施（2-3天）

#### 第17-18天: 更新 Core

**任务清单**:
- [ ] 检查 hooks/core.md（228词）
- [ ] 评估是否需要调整
- [ ] 可能的改进：
  - [ ] "avoid broad parent searches" → "search efficiently when needed"
  - [ ] 其他保守限制的现代化
- [ ] 确保保持 228 词以内

**验收标准**:
- Core 仍然简洁（≤228词）
- 更现代化（如果有改进）
- 与新技能协调

#### 第19天: 更新文档

**任务清单**:
- [ ] 更新 README.md
  - [ ] 技能清单（7个→6个）
  - [ ] 使用场景表格
  - [ ] 决策树更新
- [ ] 更新 docs/product-design.md
- [ ] 更新 docs/behavior-spec.md
- [ ] 创建迁移指南
  - [ ] clarify → develop confirm
  - [ ] verify-and-reconcile → develop/diagnose内部
  - [ ] review → develop self-review + optimize

**验收标准**:
- 所有文档反映新架构
- 迁移指南清晰
- 用户能理解变化

---

### 阶段5: 测试与发布（3-4天）

#### 第20-22天: 综合测试

**任务清单**:
- [ ] 场景1: 简单功能开发
  - [ ] 测试 develop normal 模式
  - [ ] 验证自动验证工作
- [ ] 场景2: 复杂功能开发
  - [ ] 测试 develop confirm 模式
  - [ ] 验证结构化澄清工作
  - [ ] 测试深度验证触发
- [ ] 场景3: 从0设计
  - [ ] 测试 code-design Mode A
  - [ ] 验证设计文档生成
- [ ] 场景4: 完善设计
  - [ ] 测试 code-design Mode B
  - [ ] 验证设计改进建议
- [ ] 场景5: Bug修复
  - [ ] 测试 diagnose
  - [ ] 验证内置验证
- [ ] 场景6: 代码优化
  - [ ] 测试 optimize
  - [ ] 验证行为保持
- [ ] 场景7: 边界测试
  - [ ] 测试 boundary-test
  - [ ] 验证5类边界覆盖
- [ ] 场景8: 跨会话交接
  - [ ] 测试 handoff
  - [ ] 验证新会话可继续

**验收标准**:
- 所有场景通过
- 无明显bug
- 用户体验流畅

#### 第23天: 发布准备

**任务清单**:
- [ ] 版本号确定（v1.0.0，因为是重大重构）
- [ ] 编写 CHANGELOG.md
- [ ] 更新 package.json / plugin.json
- [ ] 准备发布说明
- [ ] 回滚方案准备

**验收标准**:
- 版本号合理
- CHANGELOG 完整
- 发布说明清晰

---

## 关于 review 技能的讨论

### 是否删除 review？

**支持删除的理由**:
```
1. develop 已有完整的 self-review（步骤6）
2. optimize 覆盖代码质量审查
3. code-design 覆盖设计评估
4. boundary-test 覆盖安全边界
5. 减少技能数量

review 的8个维度都被覆盖:
  Requirements    → develop 步骤2
  Correctness     → develop 步骤5-6
  Safety          → develop + boundary-test
  Design          → code-design + optimize
  Readability     → optimize
  Tests           → develop 步骤4
  Documentation   → develop 步骤7
  Scope           → develop 步骤6
```

**支持保留的理由**:
```
1. "审查别人的代码"场景
2. "正式的、第三方的、只读的审查"语义
3. 8个维度的结构化检查清单
4. PR审查工作流
```

**推荐决策**: 

**方案A（激进）: 删除 review**
```
优点:
  ✅ 技能数量最少（6个）
  ✅ 职责最清晰
  ✅ develop 自审已经很严格
  
缺点:
  ❌ 失去"审查别人代码"的场景
  ❌ 失去"第三方视角"

适用场景:
  - AI 辅助的个人开发（主要场景）
  - develop 自审已足够
```

**方案B（保守）: 保留 review**
```
优点:
  ✅ 保留"审查别人PR"场景
  ✅ 保留"第三方视角"
  ✅ 8个维度的检查清单
  
缺点:
  ❌ 技能数量多1个（7个）
  ❌ 与 develop self-review 有重叠

适用场景:
  - 团队协作开发
  - 需要审查别人的PR
```

**最终建议**: 方案B（保守，保留 review）

理由:
```
1. "审查别人PR"是真实需求
2. review 设计得很好（8维度）
3. 与 develop self-review 的定位不同:
   - self-review: 实施者自查（发现问题立即修）
   - review: 第三方审查（只读输出问题清单）
4. 仅增加1个技能（7个 vs 6个），代价不大
5. 保守方案风险更低
```

因此，最终架构是 **7个技能**，而非6个：
```
1. develop
2. code-design
3. diagnose
4. optimize
5. boundary-test
6. review（保留）
7. handoff
```

---

## 风险评估与缓解

### 高风险

**R1: 用户习惯打破（clarify 删除）**
```
影响: 中等
概率: 高

缓解:
  1. 提供别名（clarify → develop confirm）
  2. 明确的迁移指南
  3. 3个月过渡期（显示弃用警告）
  4. 文档中明确说明变化原因
```

**R2: 验证逻辑复杂化（verify-and-reconcile 内部化）**
```
影响: 中等
概率: 中

缓解:
  1. develop 和 diagnose 自动判断验证深度
  2. 简单任务用简单验证，复杂任务用深度验证
  3. 充分测试不同复杂度的场景
  4. 提供 develop --strict 选项强制深度验证
```

### 中风险

**R3: 新技能（optimize, boundary-test）学习曲线**
```
影响: 低
概率: 高

缓解:
  1. 丰富的示例和模板
  2. 清晰的使用场景说明
  3. 与现有技能的关系明确
  4. 场景驱动的文档
```

**R4: 技能内容增加（develop 120行，code-design 150行）**
```
影响: 低
概率: 高

缓解:
  1. 保持结构清晰（分步骤）
  2. 每个步骤职责单一
  3. 充分的示例
  4. AI 能理解长文档（Fable 5）
```

### 低风险

**R5: 依赖关系变化**
```
影响: 低
概率: 低

缓解:
  1. 依赖关系简化（最多2层）
  2. 大部分技能无依赖
  3. config/skills.json 明确定义
```

---

## 成功指标

### 定量指标

1. **技能数量**
   - 当前: 7个
   - 目标: 7个（保留 review）或 6个（删除 review）
   - 实际: 7个（保守方案）
   - 变化: +0个（但功能更完整）

2. **技能总行数**
   - 当前: 430行
   - 目标: ~750行
   - 变化: +75%（但功能增加更多）

3. **依赖深度**
   - 当前: 3层（develop → diagnose → verify）
   - 目标: 2层（develop → code-design）
   - 改进: -33%

4. **无依赖技能数**
   - 当前: 2个（clarify, handoff）
   - 目标: 5个（code-design, diagnose, boundary-test, review, handoff）
   - 改进: +150%

### 定性指标

1. **需求覆盖度**
   ```
   您的6个需求:
   1. develop（含澄清）      ✅ 完整覆盖
   2. code-design（3模式）   ✅ 完整覆盖
   3. diagnose              ✅ 完整覆盖
   4. 代码优化              ✅ 新增 optimize
   5. 边界测试              ✅ 新增 boundary-test
   6. 交接文档              ✅ 完整覆盖
   
   覆盖率: 100%
   ```

2. **参考项目问题避免**
   ```
   superpowers:
   ❌ 流程太重          ✅ 已避免（轻量Core + 显式触发）
   
   grell-docs:
   ❌ 问题太多          ✅ 已避免（materially changing过滤）
                       ✅ 进一步增强（结构化框架）
   
   ponytail:
   ❌ 为了少而少        ✅ 已避免（质量>行数）
   ```

3. **架构清晰度**
   ```
   职责重叠:   高 → 低（删除clarify）
   依赖复杂度: 高 → 低（简化2层）
   封装性:     低 → 高（内部化verify）
   可理解性:   中 → 高（明确定位）
   ```

---

## 最终总结

### 核心变化

**删除（3个）**:
```
❌ clarify              → develop confirm覆盖
❌ verify-and-reconcile → develop/diagnose内部化
❌ （不删除review，保留）
```

**新增（2个）**:
```
✅ optimize            → 专门的代码优化
✅ boundary-test       → 系统化边界测试
```

**增强（4个）**:
```
✅ develop
   - 步骤2: 结构化澄清框架（grell-docs式）
   - 步骤7: 内部化验证逻辑
   
✅ code-design
   - Mode A: Greenfield Design（从0开始）
   - Mode B: Design Refinement（完善设计）
   - Mode C: Code Assessment（原有功能）
   
✅ diagnose
   - 内置验证逻辑
   - 简化依赖
   
✅ handoff
   - 详细的交接模板
```

**保持（1个）**:
```
✅ review（保守决策，保留）
```

### 最终架构（7个技能）

```
1. develop          - 端到端开发（含澄清、验证）
2. code-design      - 设计（3种模式）
3. diagnose         - 诊断修复（含验证）
4. optimize         - 代码优化（新增）
5. boundary-test    - 边界测试（新增）
6. review           - 第三方审查（保留）
7. handoff          - 跨会话交接
```

### 与您需求的完美匹配

```
您的需求                      最终架构
────────────────────────────────────────
1. develop（含问题澄清、      ✅ develop
   方案澄清、grell-docs式）      步骤2：结构化澄清

2. code-design                ✅ code-design
   （0起步项目、完善设计）       3种模式全覆盖

3. diagnose（找问题修bug）    ✅ diagnose
                                内置验证

4. 代码优化部分               ✅ optimize（新增）
                                4维度优化

5. 边界测试                   ✅ boundary-test（新增）
                                5类边界

6. 交接文档                   ✅ handoff
                                详细模板
```

### 实施时间表

```
总时间: 23天（约5周）

阶段1: 增强现有（7天）
阶段2: 创建新技能（8天）
阶段3: 删除冗余（1天）
阶段4: 更新基础设施（3天）
阶段5: 测试与发布（4天）
```

### 下一步行动

1. **立即**：评审本方案，确认是否符合预期
2. **第1周**：开始阶段1（增强现有技能）
3. **第2-3周**：阶段2（创建新技能）
4. **第4周**：阶段3-4（清理和更新）
5. **第5周**：阶段5（测试和发布）

---

**文档系列完成**

7份文档已创建在 `docs/reactDocs/`:
1. `01-current-architecture-analysis.md` - 整体架构与develop/clarify/verify分析
2. `02-diagnose-design-review-analysis.md` - diagnose/code-design/review深度分析
3. `03-core-and-dependency-analysis.md` - Core机制与依赖图谱分析
4. `04-optimization-plan-based-on-requirements.md` - 基于您需求的优化方案
5. `05-detailed-improvements.md` - develop/code-design/optimize详细改进
6. `06-boundary-test-and-final-architecture.md` - boundary-test与最终架构
7. `07-implementation-plan-and-summary.md` - 实施计划与总结（本文档）

**总计**: 约 50,000 词的深度分析和详细方案