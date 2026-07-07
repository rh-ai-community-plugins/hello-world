# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is `hello-plugin-world`, a community plugin for the **Red Hat OpenShift AI (RHOAI) Dashboard**. It uses Webpack 5 Module Federation to expose remote modules that the RHOAI dashboard host application loads at runtime.

## Build & Development Commands

```bash
npm run start:dev     # Dev server on port 9111 with HMR
npm run build         # Production build to dist/
npm test              # Run all tests (Jest + jsdom)
npm run test:watch    # Watch mode
npm run test:coverage # Tests with coverage report
npm run lint          # ESLint on src/
```

To run a single test file:
```bash
npx jest src/app/components/HelloWorldPage.test.tsx
```

## Architecture

### Module Federation Plugin System

The plugin exposes two remote modules to the RHOAI dashboard host via Webpack Module Federation (configured inline in `config/webpack.common.js`):

- **`./extensions`** (`src/rhoai/extensions.ts`) — Defines three extension points: `app.area` (registers the plugin area), `app.navigation/href` (adds sidebar nav link to `/hello-world`), and `app.route` (mounts the page component).
- **`./Icon`** (`src/rhoai/HelloWorldNavIcon.tsx`) — SVG icon displayed in the dashboard sidebar.

Shared singletons (react, react-dom, react-router-dom, @patternfly/react-core, @openshift/dynamic-plugin-sdk) are provided by the host and not bundled into the plugin.

### Entry Point Chain

`src/index.ts` → dynamic import → `src/bootstrap.tsx` (React 18 root render). The dynamic import is required for Module Federation to resolve shared dependencies before the app renders.

### Plugin Registration

`plugin.yaml` at the repo root defines the plugin metadata for the RHOAI plugin registry (name, version, remote entry URL, routes, icon).

### Webpack Configs

- `config/webpack.common.js` — Shared config: entry point, loaders, Module Federation, path alias `~` → `./src`
- `config/webpack.dev.js` — Dev server on port 9111, proxies `/hello-world` to `localhost:8843`
- `config/webpack.prod.js` — Output to `dist/`, CSS extraction, vendor chunk splitting

### Test Setup

Jest with `ts-jest` preset and `jsdom` environment. `jest.setup.tsx` mocks `react-router-dom` (useNavigate, useParams, useLocation, Outlet, Routes, Route) and polyfills TextEncoder/TextDecoder. CSS modules are proxied to return property names as class names (`jest.style-mock.js`).

### Deployment

- **Container**: Multi-stage build in `Containerfile` — Node 20 Alpine builder → Nginx Alpine serving `dist/` on port 8080 as UID 1001. Nginx adds CORS header on `remoteEntry.js`.
- **Helm chart**: `chart/` deploys to Kubernetes with Deployment + Service. Image defaults to `quay.io/rh-ai-community-plugins/rhoai-hello-world:latest`.
- **CI**: `.github/workflows/ci.yml` runs tests and lint on push/PR to main. `build-push.yml` builds and pushes the container image on release/tag.

## Key Conventions

- Path alias: `~` maps to `./src` (webpack) and `@` maps to `./src` (jest). Use `~` in source code imports.
- UI components use **PatternFly 6** (`@patternfly/react-core`, `@patternfly/react-icons`).
- TypeScript strict mode is enabled. Target is ES2020 with ESNext modules and `react-jsx` transform.
- No standalone ESLint config file — uses `@typescript-eslint` defaults via dev dependencies.
