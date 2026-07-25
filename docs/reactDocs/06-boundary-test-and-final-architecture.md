# 详细实施方案（第6部分：boundary-test、内部化验证、最终架构）

## 改进4: 创建 boundary-test skill（新增）

### 完整的 boundary-test 定义

```markdown
---
name: boundary-test
description: Systematic boundary and edge case testing 
             after feature implementation to catch 
             unexpected failures and security vulnerabilities
---

# Boundary Test

Test what TDD doesn't systematically cover: boundaries, 
edge cases, and attack scenarios.

## When to use

**After feature implementation:**
- Feature passes normal TDD tests
- Need to verify robustness
- Need to test security boundaries

**For security-sensitive code:**
- Authentication/authorization
- Payment processing
- Data access/privacy
- User input handling
- File operations

**For data processing:**
- Parsing/validation
- Calculations
- Aggregations
- Transformations

## When NOT to use

- Feature not implemented yet → use TDD in `develop` first
- Already have comprehensive edge case tests → not needed
- Simple CRUD with framework protection → low value

---

## Process

### 1. Identify applicable boundaries

Review the feature and classify applicable boundaries:

**Input Boundaries:**
- ✓ Accepts user input?
- ✓ Receives data from external system?
- ✓ Parses files/requests?

**State Boundaries:**
- ✓ Maintains internal state?
- ✓ Has lifecycle (init/active/cleanup)?
- ✓ Supports concurrent access?

**Resource Boundaries:**
- ✓ Uses memory/disk/network?
- ✓ Has timeouts/limits?
- ✓ Manages connections/handles?

**Data Boundaries:**
- ✓ Processes collections?
- ✓ Performs calculations?
- ✓ Handles dates/times/currency?

**Business Boundaries:**
- ✓ Enforces business rules?
- ✓ Checks permissions?
- ✓ Validates workflows?

### 2. Generate test matrix

For each applicable boundary, generate test cases:

---

## Input Boundaries

### Null/Empty/Undefined

```python
# Examples
test('rejects null user ID', async () => {
  await expect(getUser(null)).rejects.toThrow('User ID required');
});

test('rejects empty string username', async () => {
  await expect(createUser('')).rejects.toThrow('Username required');
});

test('rejects undefined parameters', () => {
  expect(() => calculate(undefined, 10)).toThrow();
});
```

### Type Mismatches

```python
test('rejects string where number expected', () => {
  expect(() => setAge('twenty')).toThrow('Age must be a number');
});

test('rejects array where object expected', async () => {
  await expect(saveUser([1, 2, 3])).rejects.toThrow();
});
```

### Min/Max Values

```python
test('rejects negative age', () => {
  expect(() => setAge(-1)).toThrow('Age must be non-negative');
});

test('rejects age over 150', () => {
  expect(() => setAge(200)).toThrow('Age exceeds maximum');
});

test('handles maximum integer', () => {
  expect(calculate(Number.MAX_SAFE_INTEGER, 1)).toBe(...);
});
```

### Malicious Input (Security)

```python
test('prevents SQL injection', async () => {
  const malicious = "'; DROP TABLE users; --";
  const result = await searchUsers(malicious);
  expect(result).toEqual([]); // Safe, returns empty, doesn't execute
});

test('prevents XSS in comments', () => {
  const xss = '<script>alert("XSS")</script>';
  const safe = sanitizeComment(xss);
  expect(safe).not.toContain('<script>');
});

test('prevents path traversal', async () => {
  await expect(readFile('../../../etc/passwd'))
    .rejects.toThrow('Invalid file path');
});
```

---

## State Boundaries

### Uninitialized Access

```python
test('prevents operation before initialization', () => {
  const service = new PaymentService();
  // Don't call service.initialize()
  expect(() => service.processPayment(...))
    .toThrow('Service not initialized');
});
```

### Invalid State Transitions

```python
test('prevents double submission', async () => {
  const order = await createOrder(...);
  await submitOrder(order.id);
  await expect(submitOrder(order.id))
    .rejects.toThrow('Order already submitted');
});

test('prevents modification after finalization', () => {
  const doc = createDocument();
  doc.finalize();
  expect(() => doc.edit(...))
    .toThrow('Cannot edit finalized document');
});
```

### Concurrent Access (Race Conditions)

```python
test('handles concurrent updates safely', async () => {
  const userId = '123';
  const updates = Promise.all([
    updateUserBalance(userId, 100),
    updateUserBalance(userId, -50),
    updateUserBalance(userId, 25),
  ]);
  await updates;
  const user = await getUser(userId);
  expect(user.balance).toBe(75); // Correctly sequenced
});

test('prevents double-click submission', async () => {
  const promises = [
    submitForm(data),
    submitForm(data), // Simultaneous
  ];
  const results = await Promise.allSettled(promises);
  const successes = results.filter(r => r.status === 'fulfilled');
  expect(successes).toHaveLength(1); // Only one succeeds
});
```

---

## Resource Boundaries

### Memory/Disk Exhaustion

```python
test('handles large input gracefully', async () => {
  const huge = 'x'.repeat(10_000_000); // 10MB string
  await expect(processText(huge))
    .rejects.toThrow('Input too large');
});

test('limits collection size', () => {
  const service = new CacheService({ maxSize: 1000 });
  for (let i = 0; i < 2000; i++) {
    service.set(`key${i}`, `value${i}`);
  }
  expect(service.size()).toBeLessThanOrEqual(1000);
});
```

### Timeout/Expiration

```python
test('times out long-running operation', async () => {
  const slowOperation = () => new Promise(resolve => {
    setTimeout(resolve, 10000); // 10 seconds
  });
  
  await expect(
    executeWithTimeout(slowOperation, 1000) // 1 second timeout
  ).rejects.toThrow('Operation timed out');
});

test('rejects expired token', async () => {
  const expiredToken = generateToken({ exp: Date.now() - 1000 });
  await expect(validateToken(expiredToken))
    .rejects.toThrow('Token expired');
});
```

### Connection/Handle Limits

```python
test('handles connection pool exhaustion', async () => {
  const connections = [];
  for (let i = 0; i < 100; i++) {
    connections.push(db.getConnection());
  }
  await Promise.all(connections);
  
  // Pool exhausted, should queue or reject gracefully
  const result = await db.query('SELECT 1');
  expect(result).toBeDefined(); // Still works or fails gracefully
});
```

---

## Data Boundaries

### Empty Collections

```python
test('handles empty array', () => {
  expect(calculateAverage([])).toBeNull(); // or throw, or return 0
});

test('handles empty object', () => {
  expect(mergeConfig({})).toEqual(defaultConfig);
});
```

### Single Element

```python
test('handles single-item array', () => {
  expect(calculateMedian([42])).toBe(42);
});
```

### Very Large Collections

```python
test('handles 10k item array', () => {
  const large = Array.from({ length: 10000 }, (_, i) => i);
  const result = processItems(large);
  expect(result).toHaveLength(10000);
});

test('paginates large result sets', async () => {
  const { items, hasMore } = await fetchItems({ limit: 100 });
  expect(items).toHaveLength(100);
  expect(hasMore).toBe(true);
});
```

### Numeric Boundaries

```python
test('handles overflow gracefully', () => {
  const max = Number.MAX_SAFE_INTEGER;
  expect(() => add(max, 1000))
    .toThrow('Overflow'); // or handle gracefully
});

test('handles floating point precision', () => {
  expect(0.1 + 0.2).toBeCloseTo(0.3, 10); // Not exact equality
});

test('handles division by zero', () => {
  expect(() => divide(10, 0))
    .toThrow('Division by zero');
});
```

### String/Encoding Boundaries

```python
test('handles unicode correctly', () => {
  const emoji = '😀👍🎉';
  expect(countCharacters(emoji)).toBe(3); // Not byte length
});

test('handles multi-byte characters', () => {
  const chinese = '你好世界';
  expect(truncate(chinese, 2)).toBe('你好');
});

test('handles newlines and special chars', () => {
  const text = 'Line1\nLine2\tTabbed';
  expect(parseText(text)).toEqual(['Line1', 'Line2\tTabbed']);
});
```

### Date/Time Boundaries

```python
test('handles timezone correctly', () => {
  const utc = new Date('2024-01-01T00:00:00Z');
  const result = formatForUser(utc, 'America/New_York');
  expect(result).toContain('2023-12-31'); // Previous day
});

test('handles leap year', () => {
  expect(isValidDate(2024, 2, 29)).toBe(true);
  expect(isValidDate(2023, 2, 29)).toBe(false);
});

test('handles daylight saving time', () => {
  // Test date when DST changes
  const dstChange = new Date('2024-03-10T02:00:00');
  // Implementation depends on requirements
});
```

---

## Business Boundaries

### Zero Amounts

```python
test('handles zero payment', async () => {
  await expect(processPayment(0))
    .rejects.toThrow('Payment amount must be positive');
});

test('allows zero refund', async () => {
  // May be valid in some business contexts
  const result = await processRefund(orderId, 0);
  expect(result.amount).toBe(0);
});
```

### Expired/Revoked Tokens

```python
test('rejects revoked API key', async () => {
  const revokedKey = 'revoked-key-123';
  await expect(makeRequest(revokedKey))
    .rejects.toThrow('API key revoked');
});

test('rejects expired session', async () => {
  const expiredSession = createSession({ 
    expiresAt: Date.now() - 1000 
  });
  await expect(authenticateSession(expiredSession))
    .rejects.toThrow('Session expired');
});
```

### Skipped Workflow Steps

```python
test('prevents checkout before adding items', async () => {
  const cart = createCart();
  // Don't add items
  await expect(checkout(cart))
    .rejects.toThrow('Cart is empty');
});

test('requires approval before execution', async () => {
  const task = createTask();
  // Don't approve
  await expect(executeTask(task))
    .rejects.toThrow('Task not approved');
});
```

### Duplicate Operations

```python
test('prevents duplicate email registration', async () => {
  const email = 'test@example.com';
  await registerUser({ email });
  await expect(registerUser({ email }))
    .rejects.toThrow('Email already registered');
});

test('prevents duplicate payment processing', async () => {
  const orderId = '123';
  await processPayment(orderId);
  await expect(processPayment(orderId))
    .rejects.toThrow('Order already paid');
});
```

---

## 3. Define expected behavior

For each test case, explicitly define:

**Fail-fast (throw error):**
- User input errors
- Programmer errors (wrong types)
- Security violations

**Graceful degradation:**
- External service failures
- Resource exhaustion
- Timeout scenarios

**Default/Null-object:**
- Empty collections
- Missing optional parameters
- Uninitialized state (if safe)

---

## 4. Run tests and verify protection

Execute all boundary tests:

```bash
npm test -- boundary-test
# or
pytest tests/boundary/
```

**For each failing test:**
1. Is this expected behavior? (business decision)
2. Should we add protection? (validation, error handling)
3. Implement protection
4. Rerun test to verify

**For each passing test:**
1. Verify test actually exercises the boundary
2. Try mutating code - test should fail
3. Confirm error message is helpful

---

## 5. Document boundary behavior

Update documentation to clarify boundary behavior:

```python
def process_payment(amount: float, currency: str) -> PaymentResult:
    """
    Process a payment transaction.
    
    Args:
        amount: Payment amount (must be positive, max 999999.99)
        currency: ISO 4217 currency code (e.g., 'USD', 'EUR')
    
    Returns:
        PaymentResult with transaction ID and status
    
    Raises:
        ValueError: If amount <= 0 or > 999999.99
        ValueError: If currency is invalid
        PaymentError: If payment processing fails
        
    Boundary behavior:
        - Rounds to 2 decimal places
        - Minimum amount: 0.01
        - Maximum amount: 999999.99
        - Timeout: 30 seconds
    """
```

---

## Integration with other skills

**After develop (TDD):**
```
develop → (feature works) → boundary-test → (feature robust)
```

**After optimize:**
```
optimize → (code clean) → boundary-test → (still robust)
```

**Before production:**
```
boundary-test → (boundaries verified) → deploy
```

---

## Red Flags

Stop if you see:

❌ Testing implementation details (internal state)
  → Test observable behavior only

❌ Boundary tests passing but no protection code
  → Tests might not be testing what you think

❌ Adding boundaries for every possible input
  → Focus on realistic attack/error scenarios

❌ Duplicate coverage with unit tests
  → Boundary tests should test NEW cases

---

## Success Criteria

Boundary testing is complete when:

✅ All 5 boundary categories reviewed
✅ Applicable boundaries have test cases
✅ Expected behaviors explicitly defined
✅ Protection code verified by tests
✅ Documentation updated with boundary behavior
✅ Security boundaries explicitly tested
```

### 关键设计决策

**决策1: 5类边界系统化**
```
Input, State, Resource, Data, Business
→ 结构化检查，不遗漏
→ 类似 code-design 的"设计压力"方法
```

**决策2: 在 TDD 之后**
```
TDD (develop): Happy path + 已知错误
boundary-test: 未预期边界 + 攻击场景

时序: develop → boundary-test
不是替代 TDD，是补充 TDD
```

**决策3: 安全边界优先**
```
SQL 注入、XSS、路径穿越
→ 这些是最重要的边界测试
→ 明确的测试示例
```

---

## 改进5: 内部化 verify-and-reconcile

### 为什么要内部化？

**当前问题**:
```
1. verify-and-reconcile 既是步骤又是技能（双重身份）
2. develop 步骤7说"Use verify-and-reconcile"（暴露实现细节）
3. 用户困惑何时单独调用
4. 依赖关系复杂
```

### 内部化方案

**删除独立的 verify-and-reconcile skill**

**在 develop 步骤7中展开验证逻辑**:

```markdown
## 7. Complete with Verification

### 7.1 Run fresh verification

Execute scope-appropriate verification commands:

**For all changes:**
- Focused tests covering changed behavior
- Compilation/type checking (if applicable)
- Linter on changed files
- Format check

**For specific risk types:**
- Data changes: Migration rollback test
- Permissions: Authorization test matrix
- API changes: Contract test
- Performance: Benchmark comparison
- Security: Penetration test (if applicable)

**Record actual command output, not claims:**
```bash
$ npm test -- user.test.js
✓ creates user with valid data
✓ rejects invalid email
✓ enforces unique email constraint
PASS (3/3 tests)
```

### 7.2 Verify acceptance behavior

For each requirement from step 2 (Align):

**Implemented and verified:**
- Requirement X: ✓ (test: user.test.js:15-25)

**Implemented but partially verified:**
- Requirement Y: ✓ code exists, ⚠️ manual test only

**Incomplete:**
- Requirement Z: ❌ deferred to next iteration

Do NOT rewrite requirements to match what was built.
If implementation deviated, report it explicitly.

### 7.3 Reconcile documentation

**Update authoritative design/requirement docs:**
- Changed behavior or decisions
- Confirmed alternatives
- Mark stale sections without creating second source

**Do NOT update docs for:**
- Implementation notes
- Temporary decisions
- One-off lessons

**Update project instructions (AGENTS.md/CLAUDE.md):**
ONLY if this establishes a durable cross-task rule:
- Recurring failure pattern fixed
- New authoritative command
- Safety boundary discovered
- Undocumented convention now formalized

**Do NOT update project instructions for:**
- Task-specific business rules
- Temporary commands
- Implementation notes
- One-off lessons

### 7.4 Clean up and report

**Remove:**
- Temporary logs, probes, debug code
- Generated test artifacts
- Commented-out code

**Verify no unauthorized operations:**
- No commits (unless explicitly requested)
- No pushes
- No published packages
- No installed dependencies
- No global config changes

**Report:**
- Verification commands run and results
- Requirements implementation status
- Documentation changes made
- Remaining gaps or unverified areas

### 7.5 Decide depth based on complexity

**Simple changes (auto-decide):**
Small, local, low-risk changes:
- Run focused tests
- Quick documentation check
- Done

**Complex changes (deep verification):**
Multiple acceptance criteria, permissions/data risk, 
migrations, or authoritative doc updates:
- Full test matrix
- Comprehensive docs review
- Explicit instruction-file decision
- Detailed report

AI should auto-decide based on objective criteria, 
not user input.
```

### 在 diagnose 中的验证

```markdown
## 5. Clean up and complete

**Remove temporary artifacts:**
- Debug logs and probes
- Test fixtures
- Diagnostic code

**Run focused verification:**
- Regression test passes
- Original symptom resolved
- No new test failures

**Report:**
- Root cause found
- Evidence gathered
- Fix applied (if requested)
- Remaining uncertainty

**Deep verification NOT needed for simple bug fixes.**
Only use comprehensive verification (like develop step 7.3-7.5) 
when the fix is complex or risky.
```

### 收益分析

```
删除 verify-and-reconcile skill:
  ✅ 依赖关系简化（2个技能不再依赖它）
  ✅ 封装性提高（内部实现不暴露）
  ✅ 用户理解成本降低（少1个概念）
  ✅ 技能数量减少（7 → 6）

展开到 develop 和 diagnose:
  ✅ 验证逻辑更清晰
  ✅ 自动判断验证深度
  ✅ 无需用户决策

保持功能完整:
  ✅ 所有验证步骤都保留
  ✅ 简单任务用简单验证
  ✅ 复杂任务用深度验证
```

---

## 最终优化后的架构

### 技能清单（6个）

```
1. develop
   - 职责: 端到端开发
   - 包含: 澄清（grell-docs式）+ 实施 + 验证（内置）
   - 模式: normal / confirm
   - 依赖: code-design（可选）
   - 行数: ~120行（增加澄清框架 + 验证展开）

2. code-design
   - 职责: 设计评估与创建
   - 包含: 3种模式（Greenfield / Refinement / Assessment）
   - 模式: 自动识别
   - 依赖: 无
   - 行数: ~150行（增加Mode A和B）

3. diagnose
   - 职责: 问题诊断与修复
   - 包含: 根因分析 + 可选修复 + 验证（内置）
   - 依赖: 无
   - 行数: ~60行（增加内置验证）

4. optimize
   - 职责: 代码质量优化
   - 包含: 性能 / 可读性 / 可维护性 / 设计
   - 约束: 行为不变 + 必须有测试
   - 依赖: code-design（参考标准）
   - 行数: ~180行（新增）

5. boundary-test
   - 职责: 边界与极端情况测试
   - 包含: 5类边界（Input/State/Resource/Data/Business）
   - 时机: develop 之后
   - 依赖: 无
   - 行数: ~200行（新增）

6. handoff
   - 职责: 跨会话交接
   - 包含: 状态快照
   - 依赖: 无
   - 行数: ~40行（略微扩展模板）

总计: ~750行（vs 当前 430行，增加75%，但功能更完整）
```

### 依赖关系图（最终）

```
develop
  └── code-design (可选，当步骤3需要设计评估时)

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

依赖深度: 最多2层（develop → code-design）
无依赖技能: 4个（code-design, diagnose, boundary-test, handoff）
```

### 与您需求的对应

```
您的需求                      最终设计
────────────────────────────────────────────────
1. develop（含澄清）          ✅ develop (enhanced)
   包含grell-docs式提问       ✅ 步骤2增加结构化框架

2. code-design               ✅ code-design (3 modes)
   从0的项目                 ✅ Mode A: Greenfield
   完善设计文档              ✅ Mode B: Refinement

3. diagnose                  ✅ diagnose (enhanced)
   找问题修bug               ✅ 保持核心功能
                            ✅ 内置验证

4. 代码优化                  ✅ optimize (new)
   专门的优化workflow        ✅ 4个维度优化
                            ✅ 行为保持不变

5. boundary-test            ✅ boundary-test (new)
   边界极端测试             ✅ 5类边界系统化

6. handoff                  ✅ handoff (enhanced)
   跨会话交接               ✅ 保持简洁
```
