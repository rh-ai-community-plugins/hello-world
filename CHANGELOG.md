# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Intermittent `ChunkLoadError` on plugin load caused by vendor chunk splitting in the production webpack build ([#24](https://github.com/rh-ai-community-plugins/hello-world/issues/24))

## [0.4.0] - 2026-07-10

### Added

- Three demo pages — User Info, Cluster Resources, and Namespace Summary — each demonstrating a different RHOAI Dashboard integration pattern (dashboard API, K8s pass-through, and BFF)
- Backend-for-Frontend (BFF) service: standalone Express.js + TypeScript backend with namespace and pod aggregation endpoint
- Community plugins shared navigation section with custom SVG icons, designed for multi-plugin ecosystems
- Community Plugin banner across all plugin pages for consistent branding
- Admin-only section on the User Info page with role-based visibility
- ProjectSelector component with localStorage-backed favorites
- Interactive `rename-plugin` script for forking the seed project into a new plugin
- Claude Code skills for plugin development workflows (add/remove pages, add BFF endpoints, rename plugin)
- Makefile with build targets for common development tasks
- Component tests for page components
- Comprehensive documentation: architecture guides, BFF pattern, local dev setup, deployment, and customization reference
- `CHANGELOG.md` and `CONTRIBUTING.md`
- Apache License 2.0 (`LICENSE`)

### Changed

- Unified `plugin.yaml` as a single flat manifest for both Module Federation config and community plugin catalog metadata
- Switched container base images from Alpine to Red Hat UBI9
- Renamed Helm chart to `hello-world-chart` to avoid OCI registry collisions
- Renamed plugin from `hello-plugin-world` to `hello-world`
- Reorganized source files to align with odh-dashboard conventions
- Streamlined CI/CD build-push workflow with BFF support in build and scan scripts
- Automated version sync across `package.json`, `Chart.yaml`, `bff/package.json`, and `plugin.yaml`
- Renamed `CLAUDE.md` to `AGENTS.md` for agent-harness portability (`CLAUDE.md` kept as symlink)

### Fixed

- Relative route handling so the plugin renders correctly inside the dashboard routing context
- Helm chart OpenShift compatibility (security context constraints, route TLS)
- `useK8sResources` loading state stuck true when deselecting a project
- BFF namespace summary now surfaces partial failures in the response instead of silently dropping them
- `useAccessReview` wired into Cluster Resources page to disable create buttons when RBAC denies access
- `useAccessReview` switched from `Promise.all` to `Promise.allSettled` to preserve successful checks
- Added AbortController cleanup to `useCurrentUser`, `useProjects`, and `useNamespaceSummary` hooks
- BFF CA certificate cached at module load instead of reading from disk on every request
- Renamed `useFavoriteProjects.test.ts` to `.spec.ts` to match `jest.config.js` testMatch pattern
- Added missing `[PLUGIN-SPECIFIC]` comments to `namespaceSummaryNavExtension`

## [0.3.0] - 2026-06-25

Initial release of the hello-world community plugin seed project.

### Added

- Webpack 5 Module Federation plugin scaffold for the RHOAI Dashboard
- Hello World demo page with basic extension point registration
- `plugin.yaml` manifest and Helm chart for Kubernetes deployment
- GitHub Actions CI/CD workflows for testing, linting, and container image publishing
- Container image build (`build-push.sh`) and vulnerability scan (`scan-image.sh`) scripts
- Multi-stage `Containerfile` for production builds

[Unreleased]: https://github.com/rh-ai-community-plugins/hello-world/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/rh-ai-community-plugins/hello-world/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/rh-ai-community-plugins/hello-world/releases/tag/v0.3.0
