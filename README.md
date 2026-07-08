# Hello Plugin World

A community plugin for the **Red Hat OpenShift AI (RHOAI) Dashboard** that serves as both a **reference implementation** and a **scaffold** for building your own plugins. It uses Webpack 5 Module Federation to integrate with the dashboard at runtime.

## What's Inside

The plugin provides two pages demonstrating real dashboard integration patterns:

- **User & Projects** — Displays the authenticated user's information, lists accessible projects, and shows RBAC permissions for the selected namespace
- **Cluster Resources** — Create, list, and delete Kubernetes Deployments and Services through the dashboard's K8s API pass-through

All cluster interactions use the dashboard's backend APIs (`/api/status`, `/api/k8s/*`), demonstrating the recommended pattern for plugin development.

## Quick Start

### Prerequisites

- Node.js 20+
- npm
- Access to an OpenShift cluster with RHOAI (for integration testing)

### Install

```bash
npm install
```

### Development

```bash
npm run start:dev       # Dev server on http://localhost:9112 with hot reload
```

### Build

```bash
npm run build           # Production build to dist/
```

### Test

```bash
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Tests with coverage report
```

### Lint

```bash
npm run lint            # ESLint on src/
```

## Documentation

See the [docs/](docs/) directory for detailed guides:

- **[Architecture](docs/architecture/)** -- Plugin system internals, extension contract, and community plugin examples
- **[Development](docs/development/)** -- Local environment setup, dashboard integration, and backend API reference
- **[Deployment](docs/deployment/)** -- Container image build and push instructions

## License

Apache-2.0
