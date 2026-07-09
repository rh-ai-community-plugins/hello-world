# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is `hello-plugin-world`, a community plugin for the **Red Hat OpenShift AI (RHOAI) Dashboard**. It uses Webpack 5 Module Federation to expose remote modules that the RHOAI dashboard host application loads at runtime.

## Build & Development Commands

```bash
npm run start:dev     # Dev server on port 9500 with HMR
npm run build         # Production build to dist/
npm test              # Run all tests (Jest + jsdom)
npm run test:watch    # Watch mode
npm run test:coverage # Tests with coverage report
npm run lint          # ESLint on src/
```

To run a single test file:
```bash
npx jest src/app/hooks/useCurrentUser.test.ts
```

## Architecture

### Module Federation Plugin System

The plugin exposes two remote modules to the RHOAI dashboard host via Webpack Module Federation (configured inline in `config/webpack.common.js`):

- **`./extensions`** (`src/rhoai/extensions.ts`) — Defines six extension points:
  - `app.area` — registers the `hello-world` feature area
  - `app.navigation/section` (x2) — `community-plugins` shared parent section (with `CommunityNavIcon`) and `hello-world` plugin subsection (with `HelloWorldNavIcon`)
  - `app.navigation/href` (x2) — "User Info" and "Cluster Resources" nav items under the `hello-world` section
  - `app.route` — mounts the App component with wildcard routing at `/hello-world/*`
- **`./Icon`** (`src/rhoai/HelloWorldNavIcon.tsx`) — SVG icon for the plugin's nav subsection. A separate `CommunityNavIcon.tsx` provides the icon for the shared `community-plugins` parent section.

Shared singletons (react, react-dom, react-router-dom, @patternfly/react-core, @openshift/dynamic-plugin-sdk) are provided by the host and not bundled into the plugin.

### Pages

The plugin has two pages, routed under `/hello-world/*`:

- **User Info page** (`src/app/pages/UserInfoPage.tsx`) — Displays the authenticated user's information via `/api/status`.
- **Cluster Resources page** (`src/app/pages/ClusterResourcesPage.tsx`) — Create and list Deployments and Services via the dashboard's K8s API pass-through.

### Custom Hooks

Four hooks in `src/app/hooks/` provide data fetching and API integration:

- `useCurrentUser` — Fetches authenticated user info from `/api/status`.
- `useProjects` — Fetches accessible projects from the OpenShift projects API.
- `useK8sResources` — Generic hook for listing K8s resources with create/delete helpers.
- `useAccessReview` — Checks RBAC permissions via SelfSubjectAccessReview.

### Entry Point Chain

`src/index.ts` → dynamic import → `src/bootstrap.tsx` (React 18 root render). The dynamic import is required for Module Federation to resolve shared dependencies before the app renders.

### Plugin Registration

`plugin.yaml` at the repo root defines the plugin metadata for the RHOAI plugin registry (name, version, remote entry URL, routes, icon).

### Webpack Configs

- `config/webpack.common.js` — Shared config: entry point, loaders, Module Federation, path alias `~` → `./src`
- `config/webpack.dev.js` — Dev server on port 9500, proxies `/hello-world` to `localhost:8443`
- `config/webpack.prod.js` — Output to `dist/`, CSS extraction, vendor chunk splitting

### Test Setup

Jest with `ts-jest` preset and `jsdom` environment (`jest.config.js`). `jest.setup.tsx` mocks `react-router-dom` (useNavigate, useParams, useLocation, Outlet, Routes, Route, Navigate) and polyfills TextEncoder/TextDecoder. CSS modules are proxied to return property names as class names (`jest.style-mock.js`).

### Deployment

- **Container**: Multi-stage build in `Containerfile` — Node 20 Alpine builder → Nginx Alpine serving `dist/` on port 8080 as UID 1001. Nginx adds CORS header on `remoteEntry.js`.
- **Helm chart**: `chart/` deploys to Kubernetes with Deployment + Service. Image defaults to `quay.io/rh-ai-community-plugins/hello-plugin-world:latest`.
- **CI**: `.github/workflows/ci.yml` runs tests and lint on push/PR to main. `build-push.yml` builds and pushes the container image on release/tag.

## Documentation

Project documentation lives under `docs/` in semantic subfolders:

```
docs/architecture/   — Plugin system internals and extension contract
docs/development/    — Local dev setup and dashboard API reference
docs/deployment/     — Container build instructions
docs/archives/       — Project plan and historical documents
```

## Key Conventions

- Path alias: `~` maps to `./src` (webpack) and `@` maps to `./src` (jest). Use `~` in source code imports.
- UI components use **PatternFly 6** (`@patternfly/react-core`, `@patternfly/react-icons`).
- TypeScript strict mode is enabled. Target is ES2020 with ESNext modules and `react-jsx` transform.
- No standalone ESLint config file — uses `@typescript-eslint` defaults via dev dependencies.
- Plugin-specific identifiers are annotated with `[PLUGIN-SPECIFIC]` comments; shared conventions use `[SHARED]`. See `docs/development/CUSTOMIZATION.md` for the full reference.
