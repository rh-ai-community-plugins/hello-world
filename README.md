# Hello Plugin World

A community plugin for the **Red Hat OpenShift AI (RHOAI) Dashboard** that serves as both a **reference implementation** and a **scaffold** for building your own plugins. It uses Webpack 5 Module Federation to integrate with the dashboard at runtime.

## What's Inside

The plugin provides two pages demonstrating how a community plugin works using proper dashboard integration patterns:

- **User Info** — Displays the authenticated user's information retrieved through the dashboard's backend APIs
- **Cluster Resources** — Create and list Kubernetes Deployments and Services through the dashboard's K8s API pass-through

All cluster interactions use the dashboard's backend APIs (`/api/status`, `/api/k8s/*`), demonstrating the recommended pattern for plugin development.

Those pages are only basic examples, all possible interactions and accessible APIs are described in the [Architecture](docs/architecture/README.md) and [Development](docs/development/README.md) documents.

## Quick Start

### Deploy on an Existing Dashboard

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

To deploy your own plugin image instead, see [Build & Push](docs/deployment/BUILD_AND_PUSH.md).

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
npm install              # Install dependencies
npm run start:dev        # Start the plugin dev server on port 9500
```

See the full [Local Setup Guide](docs/development/LOCAL_SETUP.md) for step-by-step instructions on both methods.

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
- **[Deployment](docs/deployment/)** -- Container image build and push instructions

## License

Apache-2.0
