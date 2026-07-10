# Hello Plugin World

A community plugin for the **Red Hat OpenShift AI (RHOAI) Dashboard** that serves as both a **reference implementation** and a **scaffold** for building your own plugins. It uses Webpack 5 Module Federation to integrate with the dashboard at runtime.

## What's Inside

The plugin provides three pages, each demonstrating a different way to integrate with the dashboard and the cluster. These are the three patterns you will use when building your own plugin:

| Page | Pattern | What it shows |
|---|---|---|
| **User Info** | Dashboard API | Call the dashboard's own backend endpoints (`/api/status`) to get user info, config, and other dashboard-managed data |
| **Cluster Resources** | K8s API pass-through | Read and write Kubernetes resources directly via the dashboard's `/api/k8s/*` proxy — CRUD on Deployments, Services, and any K8s resource the user has RBAC access to |
| **Namespace Summary** | BFF (Backend For Frontend) | Call the plugin's own backend service, which aggregates multiple K8s API calls server-side and returns a single response — useful for server-side logic, external service integration, or keeping credentials out of the browser |

The first two patterns require no additional backend — your plugin's frontend code calls dashboard endpoints directly. The BFF pattern adds a separate Node.js service (`bff/` directory) that the dashboard proxies to, forwarding the user's authentication token.

For a detailed guide on choosing the right pattern for your use case, see the [Integration Patterns](docs/development/DASHBOARD_APIS.md#integration-patterns) section. All available APIs are documented in the [Development](docs/development/README.md) guides.

## Quick Start

### Deploy this Plugin on an Existing Dashboard

If you have an OpenShift cluster with RHOAI already running, you can deploy this plugin in three steps using the pre-built container image.

**Prerequisites:** Helm, `oc` CLI access to the cluster, and access to the `redhat-ods-applications` namespace (typically requires cluster-admin).

#### 1. Install the plugin

Deploy the Helm chart into a namespace of your choice (it will be created if it doesn't exist):

```bash
helm install hello-world-plugin chart/ \
  --namespace hello-world \
  --create-namespace
```

This creates a Deployment and a Service (`hello-world-plugin`) that serves the plugin's `remoteEntry.js` via Nginx.

#### 2. Register with the RHOAI Dashboard

Retrieve the current Module Federation configuration from the dashboard, append the plugin entry, and apply it:

```bash
oc get configmap federation-config \
  -n redhat-ods-applications \
  -o jsonpath='{.data.module-federation-config\.json}' \
| python3 -c "
import json, sys
config = json.load(sys.stdin)
config.append({
  'name': 'helloWorld',
  'remoteEntry': '/remoteEntry.js',
  'authorize': False,
  'tls': False,
  'service': {
    'name': 'hello-world-plugin',
    'namespace': 'hello-world',
    'port': 8080
  }
})
print(json.dumps(config))
" > /tmp/mf-config-extended.json

oc set env deployment/rhods-dashboard \
  -n redhat-ods-applications \
  "MODULE_FEDERATION_CONFIG=$(cat /tmp/mf-config-extended.json)"
```

New dashboard pods roll out automatically. After roughly two minutes, reload the RHOAI dashboard to see the plugin's sidebar entries.

#### 3. Verify

Confirm the plugin is registered in the dashboard configuration:

```bash
oc set env deployment/rhods-dashboard -n redhat-ods-applications --list \
  | grep MODULE_FEDERATION_CONFIG \
  | python3 -c "import json,sys; d=json.loads(sys.stdin.read().split('=',1)[1]); print([e['name'] for e in d])"
```

To deploy your own plugin image instead, see [Build & Push](docs/development/BUILD_AND_PUSH.md). For the full deployment guide with Helm chart customization and BFF registration, see [Deploying on OpenShift](docs/deployment/OPENSHIFT_DEPLOY.md).

### Developing a New Plugin

This repository is designed as a **seed project**. To start developing your own plugin, **duplicate** the repo — do not fork it. Forking creates a link back to this upstream repository, which isn't what you want for an independent plugin with its own identity and lifecycle.

```bash
git clone https://github.com/rh-ai-community-plugins/hello-plugin-world.git my-plugin
cd my-plugin
rm -rf .git
git init
```

Then follow the [Customization Guide](docs/development/CUSTOMIZATION.md) to rename identifiers, update routes, and make the plugin your own.

Developing a dashboard plugin is way easier with a **running RHOAI dashboard** connected to a **real OpenShift cluster** — the plugin runs inside the dashboard and relies on its backend to proxy API calls to the cluster. You almost cannot develop the plugin in isolation if you want a proper integration with the dashboard.

There are two approaches to set up this environment:

- **Container-based** (recommended) — Run the dashboard as a container image alongside your plugin dev server. Faster to set up.
- **Source-based** — Clone and run the [odh-dashboard](https://github.com/opendatahub-io/odh-dashboard) from source alongside your plugin. More involved setup, but provides full hot module replacement for both the dashboard and the plugin.

Both methods require Node.js 20+, `oc` CLI access to the cluster, and cluster-admin privileges. Once the environment is running:

```bash
npm install              # Install plugin dependencies
npm run start:dev        # Start the plugin dev server on port 9500
```

If you want to work with the BFF pattern (Namespace Summary page), you also need to start the BFF service:

```bash
cd bff
npm install              # Install BFF dependencies (first time only)
K8S_API_BASE=$(oc whoami --show-server) npm run start:dev   # Start BFF on port 3000
```

See the full [Local Setup Guide](docs/development/LOCAL_SETUP.md) for step-by-step instructions on both methods, including dashboard proxy configuration for the BFF.

#### Build & Test

```bash
npm run build           # Production build to dist/
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Tests with coverage report
npm run lint            # ESLint on src/
```

## Documentation

See the [docs/](docs/) directory for detailed guides:

- **[Architecture](docs/architecture/)** -- Plugin system internals, extension contract, and community plugin examples
- **[Development](docs/development/)** -- Local environment setup, [customization guide](docs/development/CUSTOMIZATION.md), and backend API reference
- **[Deployment](docs/deployment/)** -- Deploying the plugin on OpenShift with Helm and dashboard registration

## License

Apache-2.0
