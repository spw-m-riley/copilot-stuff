# Verification gate

Use this reference to turn a completion claim into proof.

## Gate

1. **Identify:** Name the exact claim and proof command.
2. **Run:** Execute the proof command fresh in the current workspace.
3. **Read:** Inspect exit code, stdout, stderr, pass/fail counts, warnings, and generated artifacts.
4. **Compare:** Decide whether the output proves, disproves, or only partially supports the claim.
5. **State:** Report only what the evidence supports.

## Common false claims

| Claim | Requires | Not sufficient |
| --- | --- | --- |
| Tests pass | Test output with all relevant tests passing and exit code 0 | Prior run, lint passing, or code review |
| Linter clean | Linter output with no reported errors and exit code 0 | Formatting changed or no syntax errors |
| Build succeeds | Build command exits 0 with no build errors | Type intuition or targeted tests |
| Bug fixed | Reproduction test or live symptom now passes | Code changed but not executed |
| Agent completed | Diff, artifact, or command output proves actual work | Agent text saying it succeeded |
| Dependency installed | Package tree, lockfile, or import verification | Install command appeared to finish |

## Example verification records

```text
Claim: targeted parser regression is fixed
Command: npm test -- --testNamePattern="handles null input safely"
Success: test passes with exit code 0
Evidence: PASS src/parser.test.ts; handles null input safely
Decision: claim supported for the targeted regression only
```

```text
Claim: full repository tests pass
Command: npm test
Success: all suites pass with exit code 0
Evidence: command exited 1 with 2 failing suites
Decision: claim not supported; route to debugging
```
