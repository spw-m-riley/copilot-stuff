---
applyTo: "**/*.tf,**/*.tfvars,**/*.hcl"
---

Prefer existing modules, naming conventions, locals, and variable patterns before introducing new Terraform structure.
Keep plans predictable: avoid unnecessary churn in resource arguments, ordering, and computed values.
Prefer explicit inputs, outputs, and provider configuration over hidden coupling between modules or environments.
Reuse the repository's existing Terraform tooling and validation flow rather than introducing parallel wrappers or ad hoc scripts.
Keep resource blocks, dynamic expressions, and conditionals readable; optimize for maintainability over clever compression.
Be deliberate with `lifecycle`, `depends_on`, and `ignore_changes` so behavior stays explainable during plan and apply.
