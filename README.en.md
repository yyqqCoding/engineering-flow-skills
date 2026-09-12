<div align="center">
  <a href="https://engineering-flow-web.vercel.app">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="assets/readme/hero-en-dark.png">
      <source media="(prefers-color-scheme: light)" srcset="assets/readme/hero-en-light.png">
      <img alt="Engineering Flow: align first, then code, then prove it. The Develop lifecycle runs from discovery, clarification, and checkpoint through approval, implementation, verification, and completion, where approval is a gated human step" src="assets/readme/hero-en-light.png" width="100%">
    </picture>
  </a>
  <br><br>
  <strong>🧭 Align with acceptance examples; implement and verify in slices</strong>
  <br><br>
  <a href="https://engineering-flow-web.vercel.app"><strong>📖 Documentation</strong></a>
  &nbsp;&nbsp;·&nbsp;&nbsp;
  <a href="#quick-start">🚀 Quick start</a>
  &nbsp;&nbsp;·&nbsp;&nbsp;
  <a href="#five-workflows">🧩 Workflows</a>
  &nbsp;&nbsp;·&nbsp;&nbsp;
  <a href="#validation">📊 Validation</a>
  &nbsp;&nbsp;·&nbsp;&nbsp;
  <a href="docs/user-guide.md">User guide</a>
  <br><br>
  <a href="README.md">简体中文</a>&nbsp;·&nbsp;<a href="README.en.md">English</a>
  <br><br>
  <img alt="Codex CLI" src="https://img.shields.io/badge/Codex_CLI-supported-111820?style=flat-square">
  <img alt="Claude Code" src="https://img.shields.io/badge/Claude_Code-supported-D97757?style=flat-square">
  <img alt="Release 1.0.4" src="https://img.shields.io/badge/release-v1.0.4-2467CE?style=flat-square">
  <img alt="License MIT" src="https://img.shields.io/badge/license-MIT-4C5D6B?style=flat-square">
</div>

---

> [!IMPORTANT]
> **Engineering Flow does not take over every task.** Clear small tasks proceed directly; full workflows load only when you explicitly name one and then stay with that task.

## 🧭 Core idea

> Understand the requirement well enough to implement safely. Make the smallest clear change at the right boundary. Prove it with useful feedback. Reconcile documentation with facts, and promote only durable lessons into project rules.

| 🔎 Understand | 🎯 Align | 💻 Implement | ✅ Prove |
|---|---|---|---|
| Read project rules, authoritative docs, the relevant code, and tests | Use concrete examples to resolve material ambiguity; Develop pauses at one approval checkpoint | Reuse the right domain capability and implement verifiable behavior in the owning module | Gather evidence for each slice, then check overall acceptance and documentation |

Strong coding models already know these techniques; the problem is that they apply them inconsistently. Engineering Flow targets the three imbalances that recur most and cost the most:

| Imbalance | How it shows up | What this project does |
|---|---|---|
| **⚖️ Process weight** | A trivial task is dragged through a full process, or a hard one gets none | Clear small tasks are handled directly; full workflows load only when you name one |
| **🔁 Multi-turn continuity** | The next message forgets what the task was, so you restate it | Answers, approval, corrections, and omissions stay in the same task without re-invoking |
| **🛑 Clarification vs. authority** | Answering a question is treated as consent to start coding | Independent questions are batched; only action language after the checkpoint authorizes code |

<a id="five-workflows"></a>

## 🧩 Five workflows

Choose an entry for your current goal. Develop includes the necessary design, diagnosis, fixes, self-review, and delivery. Choose another workflow when you want a standalone proposal, investigation, or review.

<picture>
  <source media="(max-width: 640px) and (prefers-color-scheme: dark)" srcset="assets/readme/workflow-map-mobile-dark.svg">
  <source media="(max-width: 640px) and (prefers-color-scheme: light)" srcset="assets/readme/workflow-map-mobile-light.svg">
  <source media="(prefers-color-scheme: dark)" srcset="assets/readme/workflow-map-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="assets/readme/workflow-map-light.svg">
  <img alt="Choose among five entries by goal: Develop aligns, awaits approval, then implements and verifies in slices; Diagnose completes authorized repairs; Code Design returns a reusable proposal; Review is read-only until specific repairs are requested; Handoff preserves task state and existing authority." src="assets/readme/workflow-map-light.svg" width="100%">
</picture>

| Workflow | When to use it | Will it change your code? | Invocation |
|---|---|---|---|
| **💻 Develop** | A feature, refactor, added tests, or maintainability work | Only after you approve | `$engineering-flow:develop` |
| **🔍 Diagnose** | A bug, regression, wrong output, or intermittent fault | When the initial request or a follow-up asks for a repair | `$engineering-flow:diagnose` |
| **🧠 Code Design** | A goal with no settled solution, or a draft to refine | No — it returns a proposal | `$engineering-flow:code-design` |
| **👀 Review** | Reviewing a diff, branch, pull request, or uncommitted work | Read-only review; specific repairs require an explicit request | `$engineering-flow:review` |
| **🤝 Handoff** | Preserve task state and existing authority for another session | No | `$engineering-flow:handoff` |

Claude Code uses the same names with `/engineering-flow:` instead of `$engineering-flow:`. Until you name one, no full workflow is loaded.

## 🔁 Task-level continuity

An explicit invocation selects how the whole task is handled. In Develop, follow-up messages decide how that task continues:

| What you say after the checkpoint | What happens |
|---|---|
| "Proceed with the plan above" / "Start implementation" | Implementation is authorized; coding and verification begin |
| "Understood" / an answer to a clarification question | **Not approval** — it keeps waiting for clear action language |
| You point out an accepted item that was omitted | Implementation and verification resume; no second approval round |
| You add scope or change the acceptance behavior | Only the increment is realigned, with its own checkpoint |
| "Cancel" / switching workflows / an unrelated new task | The active workflow ends; an unrelated task does not inherit its authority |

Diagnose completes investigation, repair, and regression verification when the original request asks for a fix. A diagnosis-only request stays read-only until repair is authorized; a rejected diagnosis returns to evidence gathering. Review can also verify and repair specific findings after a request such as "fix items 1 and 3", without switching to Develop, subject to any existing task approval gate.

If you move from Code Design to Develop, the settled proposal is reused. Only gaps or changes need alignment before the implementation checkpoint. Handoff preserves progress, existing authority, and pending approvals for the next session.

## 🛠️ Engineering judgment

| Concern | Default decision |
|---|---|
| **Requirements** | You decide product behavior; the agent owns reversible details discoverable from the repository |
| **Code** | Reuse only domain rules that should evolve together; never abstract two blocks just because they look alike |
| **Tests** | Agree on acceptance examples, then implement and verify each behavior; risk determines test timing, and stable regressions retain red-before-green |
| **Safety** | Review stays read-only during assessment; repair authority does not extend to commits, releases, global configuration, or additional destructive actions |
| **Documentation** | Small checkpoints stay in the conversation; substantial ones follow project convention, falling back to `docs/requirements/` |

<a id="quick-start"></a>

## 🚀 Quick start

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

Start a new session after installation. Describe clear small tasks directly; invoke the full development workflow when you want the deeper process:

> 💡 **One rule to remember:** without a named workflow, only the compact Core loads; once named, approval, correction, and continuation for the same task inherit it automatically.

```text
$engineering-flow:develop
Implement order batch export. Inspect the existing design, ownership, and acceptance behavior first; present the final checkpoint after clarification and pause. Do not commit.
```

Read the checkpoint it presents, and reply once it is correct:

```text
Proceed with the plan above.
```

<a id="validation"></a>

## 📊 Validation

The figures below are historical evidence from v1.0.3 and earlier independent evaluations. The current workflow and testing changes need their own validation record; these results do not validate the new policy.

<picture>
  <source media="(max-width: 640px) and (prefers-color-scheme: dark)" srcset="assets/readme/evidence-mobile-dark.svg">
  <source media="(max-width: 640px) and (prefers-color-scheme: light)" srcset="assets/readme/evidence-mobile-light.svg">
  <source media="(prefers-color-scheme: dark)" srcset="assets/readme/evidence-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="assets/readme/evidence-light.svg">
  <img alt="Engineering Flow historical results from separate earlier cohorts: everyday behavior improved from 45/51 to 51/51, multi-turn continuity improved from 0/12 to 12/12, deterministic tests passed 50/50, and explicit routing was exact at 51/51" src="assets/readme/evidence-light.svg" width="100%">
</picture>

The graphic preserves earlier results for everyday behavior, task continuity, and routing; the table separately reports the v1.0.3 comparison of an older release with a candidate. Each cohort fixes its scenarios, model, reasoning level, and environment, and scores actual file changes and test output. Results from different fingerprints remain separate.

### v1.0.3 release gates (historical)

| Evidence | Result |
|---|---:|
| 🧪 Static and deterministic tests | **84/84 passed** |
| 🗺️ Behavioral coverage | **37 scenarios, 47/47 behavior IDs** |
| 🎯 Final-fingerprint paired cohort | **candidate 18/18, control 17/18** |
| 🔒 Contamination and unauthorized commits | **0** |

That release's final paired cohort selects 36 completed reports across the six scenarios directly owned by its Test Contract change. The candidate passed 3/3 in every scenario; the control passed 17/18, with the only failure in the older control's initial approval wording. Invocation and fixture verification passed for every selected report.

Earlier 1.0.2 and intermediate candidate results belong to older fingerprints. They remain historical evidence and are not combined with the final release cohort.

In the historical behavior cohort, the workflow side averaged about 17.6% more tool calls and 16.5% more input tokens. Those costs support invoking workflows as needed; the current version's costs need fresh measurement.

[Evaluation method](docs/testing-strategy.md) · [Full record](docs/benchmark-log.md) · [Read it online](https://engineering-flow-web.vercel.app/en/evidence)

## 📚 Documentation

| Use | Design | Evidence |
|---|---|---|
| [User guide](docs/user-guide.md) | [Product design](docs/product-design.md) | [Benchmark log](docs/benchmark-log.md) |
| [Trigger model](docs/trigger-model.md) | [Behavior specification](docs/behavior-spec.md) | [Testing strategy](docs/testing-strategy.md) |

The same material is also published as a browsable site, with a reference page per workflow, a design-principle mapping, and a replay of each flow:

**<https://engineering-flow-web.vercel.app>**

Engineering Flow focuses on Coding Agent workflows, context, multi-turn interaction, and reliability evaluation. It is not a general Agent runtime and does not take over issues, branches, commits, or releases.

## 📄 License

Released under the [MIT License](LICENSE). See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for attribution.
