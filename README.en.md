<div align="center">

<a href="https://engineering-flow-web.vercel.app">
  <img src="assets/readme/hero-motion.svg" width="100%" alt="Engineering Flow: minimal Coding Agent workflows invoked on demand, with explicit human approval and verified delivery." />
</a>

# Engineering Flow

### Minimal by default · Workflows on demand · Ship with evidence

<p>
  <a href="#quick-start"><img src="https://img.shields.io/badge/Quick_Start-GET_STARTED-167C73?style=for-the-badge" alt="Quick start" /></a>
  <a href="https://engineering-flow-web.vercel.app"><img src="https://img.shields.io/badge/Documentation-DOCS-315D9D?style=for-the-badge" alt="Documentation" /></a>
  <a href="README.md"><img src="https://img.shields.io/badge/简体中文-README-334155?style=for-the-badge" alt="中文 README" /></a>
</p>

**Codex CLI** · **Claude Code** · **v1.0.4** · **MIT**

</div>

---

## Why Engineering Flow?

<div align="center">

### 🪶 Minimal Core　　🎯 Explicit invocation　　🔁 Task continuity

### 🛑 Human approval　　✅ Verified results

</div>

## How it works

<img src="assets/readme/routing-motion.svg" width="100%" alt="Small, clear requests use the minimal Core; explicitly invoked Develop workflows align requirements, wait for human approval, implement and verify." />

**Small tasks go straight through. Full workflows are explicit. Develop never codes before approval.**

## Five workflows

<img src="assets/readme/workflow-icons.svg" width="100%" alt="Five independent workflows: Develop, Diagnose, Code Design, Review and Handoff." />

**💻 Develop** build　·　**🔍 Diagnose** debug　·　**🧠 Code Design** plan　·　**👀 Review** inspect　·　**🤝 Handoff** resume

**Boundaries:** Develop requires approval; Diagnose fixes when requested; Review is read-only by default; Design and Handoff do not modify code.

## Quick start

**Codex CLI**

```bash
codex plugin marketplace add yyqqCoding/engineering-flow-skills
codex plugin add engineering-flow@engineering-flow
```

**Claude Code**

```text
/plugin marketplace add yyqqCoding/engineering-flow-skills
/plugin install engineering-flow@engineering-flow
```

## Try it

```text
$engineering-flow:develop

Implement bulk order export.
Align requirements and acceptance behavior; present the checkpoint and pause.
```

**🛑 Once the checkpoint is accepted, reply:** `Proceed with the plan above.`

Claude Code: `/engineering-flow:develop`. Same-task follow-ups continue without re-invocation.

## Evaluation

<img src="assets/readme/evidence-summary.svg" width="100%" alt="Historical evaluation: everyday engineering 45/51 to 51/51, task continuity 0/12 to 12/12, explicit routing 51/51." />

**Historical data from v1.0.3 and earlier. Separate cohorts; not a v1.0.4 score.**

[Testing method](docs/testing-strategy.md) · [Full results](docs/benchmark-log.md) · [Online evidence](https://engineering-flow-web.vercel.app/en/evidence)

---

<div align="center">

### Build with intent. Ship with evidence.

[User guide](docs/user-guide.md) · [Product design](docs/product-design.md) · [Routing model](docs/trigger-model.md) · [Documentation](https://engineering-flow-web.vercel.app)

[MIT License](LICENSE) · [Third-party notices](THIRD_PARTY_NOTICES.md)

</div>
