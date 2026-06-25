# Cross-repo diff report

Use this template to structure findings after comparing two or more repositories.

---

## Diff report: `<target-repo>` vs `<reference-repo>`

**Comparison goal:** <!-- parity check / gap analysis / reference-guided implementation / consistency audit -->  
**Dimensions compared:** <!-- list the dimensions covered -->  
**Date:** <!-- YYYY-MM-DD -->

---

## Summary

| Dimension | Missing | Diverged | Intentional | Equivalent |
|-----------|---------|----------|-------------|------------|
| CI/CD config | | | | |
| Runtime versions | | | | |
| Dependencies | | | | |
| _(add rows for each dimension compared)_ | | | | |

**Overall assessment:** <!-- One sentence: is the target close to parity, significantly behind, or intentionally different? -->

---

## Findings by dimension

### CI/CD config

**Reference pattern:**  
<!-- What does the reference repo do? e.g. "Uses GitHub Actions with separate build/test/deploy jobs, OIDC for AWS auth, and required checks on main." -->

**Target state:**  
<!-- What does the target repo currently do? -->

| Item | Class | Detail | Recommendation |
|------|-------|--------|----------------|
| | `missing` / `diverged` / `intentional` / `equivalent` | | |

---

### Runtime versions

**Reference pattern:**  
<!-- e.g. "Node 20 pinned via Volta, Go 1.23 in go.mod toolchain directive." -->

**Target state:**  

| Item | Class | Detail | Recommendation |
|------|-------|--------|----------------|
| | | | |

---

### Dependencies

**Reference pattern:**  

**Target state:**  

| Item | Class | Detail | Recommendation |
|------|-------|--------|----------------|
| | | | |

---

<!-- Repeat section for each additional dimension compared -->

---

## Prioritised recommendations

List gaps and divergences in order of impact — correctness, security, and deployability first; style and preference last.

1. **[HIGH]** _Item_ — _Why it matters_ — _Recommended action_
2. **[MEDIUM]** _Item_ — _Why it matters_ — _Recommended action_
3. **[LOW]** _Item_ — _Why it matters_ — _Recommended action_

---

## Confirmed equivalent (no action needed)

- _Dimension / item_ — _Brief note on why it's confirmed equivalent_

---

## Out of scope / intentional differences

- _Item_ — _Why it's intentional or out of scope_
