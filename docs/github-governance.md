# GitHub Governance

This repo should use pull-request-gated development for production work.

## Current Enforcement Status

`medinaclean.com` is public so GitHub branch protection is available. The `main` branch is protected.

## Main Branch Rule

`main` is configured with:

- Require a pull request before merging.
- Require status checks to pass before merging.
- Require branches to be up to date before merging.
- Required status check: `Quality, coverage, and security`.
- Block force pushes.
- Block branch deletion.
- Require conversation resolution.
- Include administrators.

The current rule requires a PR but does not require an approving review because Ferosh may be the only active maintainer. Increase `required_approving_review_count` to `1` when another trusted collaborator is available.

## Current Repo Controls

- `.github/workflows/ci.yml` runs on pull requests and pushes to `main`.
- CI includes high-severity dependency audit, lint, typecheck, coverage tests, Playwright integration tests, and build.
- `.github/PULL_REQUEST_TEMPLATE.md` requires test and safety checklist confirmation.
- `.github/dependabot.yml` opens dependency and GitHub Actions update PRs weekly.
- GitHub deletes branches after merge.
- Dependabot security updates are enabled.
- Secret scanning and push protection are enabled.

## Development Flow

Use feature branches manually:

```bash
git switch -c feature/short-description
git push -u origin feature/short-description
gh pr create --base main --head feature/short-description
```

Do not push directly to `main` except for an explicit emergency hotfix. If an emergency hotfix skips a test, add the regression test immediately afterward.
