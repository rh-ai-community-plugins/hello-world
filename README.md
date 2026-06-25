# RHOAI Hello World Plugin

A simple "Hello World" community plugin for the Red Hat OpenShift AI (RHOAI) Dashboard. This plugin demonstrates how to create a Module Federation-based plugin that integrates with the RHOAI dashboard UI.

## Overview

This plugin adds a "Hello World" page to the RHOAI Dashboard that displays:
- A welcome message with interactive elements
- A clickable button that tracks interactions
- Plugin metadata (version, deployment mode)

Built with **PatternFly v6** UI components.

## Architecture

This plugin uses the **Module Federation** pattern to integrate with the RHOAI Dashboard:

```
┌─────────────────────────────────────────────────────────────┐
│                    RHOAI Dashboard                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Sidebar Navigation                                    │  │
│  │  └── Hello World ──────────────────────────────────┐  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Main Content Area (iframe/Module Federation)         │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  Hello World Plugin (remoteEntry.js)            │  │  │
│  │  │  ┌───────────────────────────────────────────┐  │  │  │
│  │  │  │  HelloWorldPage Component                 │  │  │  │
│  │  │  │  - Welcome message                        │  │  │  │
│  │  │  │  - Interactive button                     │  │  │  │
│  │  │  │  - Plugin metadata                        │  │  │  │
│  │  │  └───────────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
hello-plugin-world/
├── src/
│   ├── index.ts              # Entry point
│   ├── bootstrap.tsx         # React app bootstrap
│   ├── index.html            # HTML template
│   ├── typings.d.ts          # TypeScript declarations
│   ├── app/
│   │   ├── App.tsx           # Main app component
│   │   ├── utilities.ts      # Route utilities
│   │   └── components/
│   │       └── HelloWorldPage.tsx  # Main page component
│   └── rhoai/
│       ├── extensions.ts     # Module Federation extensions
│       └── HelloWorldNavIcon.tsx  # Navigation icon
├── config/
│   ├── webpack.common.js     # Common webpack config
│   ├── webpack.dev.js        # Development webpack config
│   ├── webpack.prod.js       # Production webpack config
│   ├── moduleFederation.js   # Module Federation plugin config
│   └── stylePaths.js         # Style path configuration
├── chart/                    # Helm chart for Kubernetes deployment
│   ├── Chart.yaml            # Helm chart metadata
│   ├── values.yaml           # Default values
│   └── templates/            # Kubernetes manifests
├── .github/                    # GitHub configuration
│   ├── pull_request_template.md  # PR template with checklist
│   └── workflows/              # CI/CD workflows
│       ├── ci.yml              # Linting and testing
│       └── build-push.yml      # Build and push on release
├── docs/                       # Documentation
├── plugin.yaml                 # RHOAI plugin registration
├── Containerfile               # Container build definition (podman)
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── .env.development            # Development environment variables
└── .gitignore
```

## Prerequisites

- Node.js 18+ (or 20+)
- npm or yarn
- RHOAI Dashboard (for integration testing)

## Development

### Installation

```bash
npm install
```

### Development Server

```bash
npm run start:dev
```

This starts a development server on `http://localhost:9111` with hot module replacement.

### Build

```bash
npm run build
```

This produces a production build in the `dist/` directory.

### Testing

```bash
npm test
```

Tests use semantic queries (`getByRole`, `getByText`) to verify real PatternFly v6 components. React Router is mocked for test isolation, but UI components render and behave as in production.

### Container Build (Podman)

```bash
podman build -t quay.io/rh-ai-community-plugins/rhoai-hello-world:0.1.0 .
```

### Helm Deployment

You can deploy the plugin using the included Helm chart:

```bash
# Add the chart to your Helm repository
helm repo add rhoai-plugins https://rh-ai-community-plugins.github.io/hello-plugin-world

# Deploy with default values
helm install hello-world ./chart

# Deploy with custom image
helm install hello-world ./chart --set image.tag=v0.1.0
```

#### Chart Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `image.repository` | Container image repository | `quay.io/rh-ai-community-plugins/rhoai-hello-world` |
| `image.tag` | Container image tag | `latest` |
| `image.pullPolicy` | Image pull policy | `IfNotPresent` |
| `service.type` | Kubernetes service type | `ClusterIP` |
| `service.port` | Service port | `8080` |
| `replicaCount` | Number of replicas | `1` |
| `ingress.enabled` | Enable ingress | `true` |

## CI/CD

This project uses GitHub Actions for continuous integration and deployment:

- **CI** ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)): Runs on every PR and push to `main`. Executes tests and linting.
- **Build & Push** ([`.github/workflows/build-push.yml`](.github/workflows/build-push.yml)): Builds and pushes the container image to `quay.io` on release or tag.

## Integration with RHOAI Dashboard

### Module Federation Remote

The plugin exposes two modules via Module Federation:

1. **`./extensions`** - Extension point definitions for the dashboard
2. **`./Icon`** - Navigation icon component

### Extension Points

The plugin registers the following extension points:

| Extension Type | ID | Description |
|---------------|-----|-------------|
| `app.area` | `hello-world` | Creates a top-level area in the dashboard |
| `app.navigation/href` | `hello-world-nav` | Adds a sidebar navigation link |
| `app.route` | `/hello-world/*` | Registers the plugin route |

### Adding to RHOAI Dashboard

To integrate this plugin with the RHOAI Dashboard, you need to:

1. **Build the plugin**: `npm run build`
2. **Deploy the container**: Push to your container registry
3. **Configure the dashboard**: Add the remote to the dashboard's Module Federation configuration

The dashboard needs to be configured to recognize the remote entry point:

```javascript
// In the RHOAI Dashboard configuration
const remotes = [
  {
    name: 'helloWorld',
    module: './remoteEntry.js',
    path: '/hello-world/remoteEntry.js',
  },
];
```

## Security

This plugin follows OpenShift security best practices:

- Runs as non-root user (UID 1001+)
- Uses Alpine-based images
- No privileged containers
- Read-only root filesystem (recommended)

## License

Apache-2.0

## Support

This is a community plugin. For issues or questions:

- Open an issue in this repository
- Join the RHOAI community discussions
