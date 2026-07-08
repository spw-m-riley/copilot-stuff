---
description: 'Guidance for Terraform and HCL files in this workspace'
applyTo: "**/*.tf,**/*.tfvars,**/*.hcl"
---

# Terraform guidance

## Purpose and Scope

- Applies to `**/*.tf`, `**/*.tfvars`, and `**/*.hcl` files in this workspace.
- Use these rules for predictable Terraform changes that stay aligned with existing module patterns, validation flow, and infrastructure safety constraints.

## Core Guidance

- Prefer existing modules, naming conventions, locals, and variable patterns before introducing new Terraform structure.
- Keep plans predictable: avoid unnecessary churn in resource arguments, ordering, and computed values.
- Prefer explicit inputs, outputs, and provider configuration over hidden coupling between modules or environments.
- Reuse the repository's existing Terraform tooling and validation flow rather than introducing parallel wrappers or ad hoc scripts.
- Keep resource blocks, dynamic expressions, and conditionals readable; optimize for maintainability over clever compression.
- Be deliberate with `lifecycle`, `depends_on`, and `ignore_changes` so behavior stays explainable during plan and apply.
- Never commit Terraform state, credentials, or other sensitive artifacts; keep sensitive values out of state when the repository's established patterns allow it.
- Mark sensitive variables and outputs as `sensitive = true` where appropriate, and keep variable and output contracts explicit with clear `description` and `type` fields.
- Prefer least-privilege access patterns and encryption defaults for infrastructure that handles sensitive data or crosses trust boundaries.
- Prefer small, well-bounded modules that group related resources; avoid extra abstraction layers that obscure ownership, inputs, or plan intent.
- Use data sources to look up external or shared infrastructure, but prefer direct references or module outputs for resources managed in the same stack.
- When the repository already has Terraform test or documentation patterns, extend those existing `.tftest.hcl` and doc surfaces instead of inventing ad hoc replacements.
- Document non-obvious infrastructure decisions, module assumptions, and operational constraints close to the Terraform they affect or in the repository's standard docs surface.

## Validation Expectations

- Run the repository's standard Terraform formatting, validation, lint, and test commands for any touched stack before considering the change complete.
- Verify provider versions and current schema behavior when acting on attribute-validity or deprecation guidance.

## Maintenance Notes

- Keep `## Learned Rules` as the final section in the file; do not add new sections after it.
- Append new learned rules without renumbering existing entries; numbering gaps can reflect archived or superseded rules.
- Use `[TERRAFORM]` for Terraform-specific learned rules in this file and keep broader workflow or repository-policy guidance in the root instructions.

## Learned Rules

<!-- New Rules appended below this line. Do not edit above this section -->
1. [TERRAFORM] When bumping the Terraform version to 1.6+, always migrate ALL S3 backend `assume_role` config from flat attributes (`role_arn`, `session_name`, `assume_role_tags`, `assume_role_transitive_tag_keys`) to a nested `assume_role = { role_arn, tags, transitive_tag_keys }` object — this applies everywhere the S3 backend schema is used: `backend.hcl` files, `backend "s3" {}` blocks, AND `data "terraform_remote_state"` config blocks. Terraform 1.6 removed the flat top-level form; missing any one of these will produce `unexpected attribute "role_arn"` errors at plan time.
2. [TERRAFORM] When adding `count` to an existing module that was previously unindexed, always add a `moved` block (`moved { from = module.name; to = module.name[0] }`) alongside the change. Without it Terraform plans a destroy + create of all resources in that module. If the `count` can be zero in some environments, verify the module doesn't exist in those environments' state before applying (`terraform state list | grep module-name`) — a `moved` targeting a non-existent instance will error.
3. [TERRAFORM] When migrating from CircleCI to GitHub Actions, audit all `data "terraform_remote_state"` sources and provider `assume_role` blocks for hardcoded CircleCI-specific IAM roles (e.g. `terraform-state-organization-access`) or trust-policy tags (`runtime = "CircleCI"`). GHA OIDC roles cannot assume these roles; replace them with the GHA deployment role variable and GHA-compatible session tags (`environment`, `applicationName`, `repositoryName`).
4. [TERRAFORM] Always verify how Terraform resolves relative asset paths before treating a `../../...` reference in a child module as module-relative — strings passed through module variables and functions like `filebase64sha256`/`fileset` can resolve from the root module working directory instead, which can invert an apparent path bug.
5. [TERRAFORM] When a repo-specific DevOps reviewer gives explicit backend state-key or backend-layout guidance, follow that guidance over generic naming assumptions unless the user says otherwise — state paths and backend conventions are operational details that may not be inferable from the code alone.
6. [TERRAFORM] Always verify the exact locked provider version and current schema before acting on attribute-validity or deprecation review comments — provider upgrades can invert the right fix, as in this repo where `aws_region.region` is valid on `hashicorp/aws` `6.24.0` while `aws_region.name` is deprecated.
7. [TERRAFORM] When a migration branch uses one remote-state role variable for both new Terraform-Backend state and older legacy state, do not mass-swap that shared input to the new backend role; split the variables first so legacy `terraform_remote_state` consumers keep their existing role until their backend also migrates - this PR wired one role through both the new fund-pricing state lookup and the legacy core-vpc lookup, and a straight tfvars replacement would have broken the legacy path
8. [TERRAFORM] When a Lambda (or any resource needing a local file at apply) sources its package from a downloading `data` source like `artifactory_file`, remember that `terraform apply <saved-plan>` on a separate runner does NOT re-read data sources — the file downloaded during plan is absent at apply and apply fails. Carry the artifact from plan to apply (e.g. the reusable workflow's `upload_build_artifacts`/`download_build_artifacts` into the same `artifacts_directory` that the data source's `output_path` resolves to), or deploy via S3 so no local file is needed at apply.
9. [TERRAFORM] When a provider reads its URL/host from an env var (e.g. `artifactory` via `JFROG_URL`), confirm that env var is actually present in the terraform step's environment before relying on an empty provider block — org reusable workflows often scope `JF_URL` to only the JFrog CLI setup step, so the provider sees the access token but no URL at plan/apply. Set `url` explicitly in the provider block in that case (the access token still comes from `JFROG_ACCESS_TOKEN`).
10. [TERRAFORM] When adopting a `git::`-sourced module whose own source hardcodes a `path.module`-relative `output_path` for a downloaded build artifact (rule 8's scenario), verify two extra things before trusting an `artifacts_directory`-widening fix: (a) each distinct module *call* using that source gets its own separate `.terraform/modules/<call-name>/` clone directory, so N module calls need N distinct paths covered, not one; (b) widening a reusable CI workflow's single-string `artifacts_directory` to a common ancestor that covers those paths (e.g. `.` or `.terraform/modules`) has no built-in exclude mechanism in most org reusable workflows, so it risks sweeping in `.terraform.d/plugin-cache` or `.terraform/providers` (large provider binaries) into every upload/download, ballooning CI artifact time/size. Prefer patching the module's own `output_path` to be configurable/`path.root`-relative (upstream fix) over widening a shared CI directory blind; if only the widening option is available, validate actual artifact size/time impact in a real CI run before merging, don't assume it's cheap.
11. [TERRAFORM] When adding a bare `local.map[terraform.workspace]` or `var.map[terraform.workspace]` index as a top-level `module` block argument (not merely inside a string interpolation or an ordinary resource/data-source attribute), verify the target map has an entry for every workspace name the workspace can literally resolve to during static analysis — with no real backend/workspace selected, both `tflint` and `terraform validate` evaluate `terraform.workspace` as the literal string `"default"`, and if that argument's target variable feeds a `count`/`for_each` inside the called module, the evaluator eagerly resolves the index and hard-fails with "Invalid index" on any map lacking a `"default"` key. This eager-evaluation trigger is specific to values that determine resource shape (count/for_each) in a module call — the same map indexed the same way inside a string template or a plain resource attribute (not gating count/for_each) does not trigger it, so don't assume one clean/failing example generalizes to the whole file. Fix with `lookup(local.map, terraform.workspace, <safe-default>)` rather than adding a literal `"default"` key to the map — `lookup()` also protects the real `terraform plan`/`apply` path against any future/typo'd workspace name that isn't in the map, not just the static-analysis edge case.
