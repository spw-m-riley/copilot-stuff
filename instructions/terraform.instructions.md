---
applyTo: "**/*.tf,**/*.tfvars,**/*.hcl"
---

Prefer existing modules, naming conventions, locals, and variable patterns before introducing new Terraform structure.
Keep plans predictable: avoid unnecessary churn in resource arguments, ordering, and computed values.
Prefer explicit inputs, outputs, and provider configuration over hidden coupling between modules or environments.
Reuse the repository's existing Terraform tooling and validation flow rather than introducing parallel wrappers or ad hoc scripts.
Keep resource blocks, dynamic expressions, and conditionals readable; optimize for maintainability over clever compression.
Be deliberate with `lifecycle`, `depends_on`, and `ignore_changes` so behavior stays explainable during plan and apply.

## Learned Rules

<!-- New Rules appended below this line. Do not edit above this section -->
1. [TERRAFORM] When bumping the Terraform version to 1.6+, always migrate ALL S3 backend `assume_role` config from flat attributes (`role_arn`, `session_name`, `assume_role_tags`, `assume_role_transitive_tag_keys`) to a nested `assume_role = { role_arn, tags, transitive_tag_keys }` object — this applies everywhere the S3 backend schema is used: `backend.hcl` files, `backend "s3" {}` blocks, AND `data "terraform_remote_state"` config blocks. Terraform 1.6 removed the flat top-level form; missing any one of these will produce `unexpected attribute "role_arn"` errors at plan time.
2. [TERRAFORM] When adding `count` to an existing module that was previously unindexed, always add a `moved` block (`moved { from = module.name; to = module.name[0] }`) alongside the change. Without it Terraform plans a destroy + create of all resources in that module. If the `count` can be zero in some environments, verify the module doesn't exist in those environments' state before applying (`terraform state list | grep module-name`) — a `moved` targeting a non-existent instance will error.
3. [TERRAFORM] When migrating from CircleCI to GitHub Actions, audit all `data "terraform_remote_state"` sources and provider `assume_role` blocks for hardcoded CircleCI-specific IAM roles (e.g. `terraform-state-organization-access`) or trust-policy tags (`runtime = "CircleCI"`). GHA OIDC roles cannot assume these roles; replace them with the GHA deployment role variable and GHA-compatible session tags (`environment`, `applicationName`, `repositoryName`).
4. [TERRAFORM] Always verify how Terraform resolves relative asset paths before treating a `../../...` reference in a child module as module-relative — strings passed through module variables and functions like `filebase64sha256`/`fileset` can resolve from the root module working directory instead, which can invert an apparent path bug.
