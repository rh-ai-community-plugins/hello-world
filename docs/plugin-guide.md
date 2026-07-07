# ODH Dashboard — Modular Architecture & Plugin System

## 1. How the System Works

### What It Is

The ODH Dashboard implements a **Webpack Module Federation** micro-frontend architecture. Features can run in **separate containers** and be dynamically loaded into the main dashboard at runtime. Each plugin contributes navigation items, routes, and UI components without modifying the host application code.

### The Extension Contract

Every plugin exposes an `./extensions` module that exports a default array of typed extension objects. The host dashboard consumes these to build its navigation, routes, and feature areas dynamically.

Available extension types (defined in `packages/plugin-core/src/extension-points/`):

| Type | Purpose |
|---|---|
| `app.area` | Declares a feature area gated by feature flags |
| `app.navigation/href` | Adds a sidebar navigation link |
| `app.navigation/section` | Groups navigation links into a collapsible section |
| `app.route` | Registers a URL route with a lazy-loaded component |
| `app.status-provider` | Provides a status hook for navigation items |
| `app.project-details/tab` | Adds a tab to project details views |
| `app.project-details/overview-section` | Adds a section to the project overview page |
| `app.project-details/settings-card` | Adds a settings card to project details |
| `app.tab-route/page` | Creates a tabbed page that appears as a navigation item |
| `app.tab-route/tab` | Adds a tab to a tabbed page |
| `app.task/group` | Adds a task group to the Task Assistant |
| `app.task/item` | Adds a task item to a task group |
| `app.masthead/brand` | Provides masthead branding (RHAII distributions only) |
| `app.masthead/toolbar-item` | Adds a masthead toolbar item (RHAII only) |
| `app.masthead/user-menu` | Provides user menu content (RHAII only) |
| `app.masthead/about` | Provides about modal content (RHAII only) |

Each extension can declare feature flags (`flags: { required: [...], disallowed: [...] }`) so it only appears when certain features are enabled (or disabled) on the cluster.

Packages can also define their **own** extension points in `frontend/src/odh/extension-points/`. The naming convention is `namespace.section[/sub-section]`.

### How the Backend Discovers Plugins

The configuration is **injected at deploy time**, not baked into the container image.

1. A Kubernetes **ConfigMap** named `federation-config` stores a JSON array of module definitions under the key `module-federation-config.json`
   - File: `manifests/modular-architecture/federation-configmap.yaml`

2. A **kustomize JSON patch** (`manifests/modular-architecture/deployment.yaml`) injects this ConfigMap value as the environment variable `MODULE_FEDERATION_CONFIG` into the dashboard pod

3. At startup, the backend (`packages/app-config/src/module-federation.ts`) reads `process.env.MODULE_FEDERATION_CONFIG`, parses the JSON, and normalizes each entry to the current config format. It then:
   - Registers HTTP reverse proxies at `/_mf/[name]/*` for each module's static assets (`backend/src/routes/module-federation.ts`)
   - Registers API proxies for each module's `proxyService` paths
   - Injects a `<script id="mf-remotes-json">` tag into the HTML with the list of remotes (`backend/src/routes/root.ts`)

4. The frontend (`frontend/src/plugins/useAppExtensions.ts`) reads the injected JSON, initializes `@module-federation/runtime`, and calls `loadRemote('[name]/extensions')` for each module. Loaded extensions are merged with any statically bundled extensions.

5. Components like `ExtensibleNav` (`frontend/src/app/navigation/ExtensibleNav.tsx`) and `AppRoutes` (`frontend/src/app/AppRoutes.tsx`) use `useExtensions()` hooks to render navigation items and routes from the merged extension set.

**In dev mode**, if `MODULE_FEDERATION_CONFIG` is not set, the backend falls back to scanning workspace `package.json` files for `module-federation` properties.

### Module Federation Config Format

The config supports two formats. The **new format** is recommended; the old format is deprecated but still accepted and auto-converted.

**New format** (defined in `packages/app-config/src/types.ts`):

```json
{
  "name": "myPlugin",
  "backend": {
    "remoteEntry": "/remoteEntry.js",
    "authorize": true,
    "tls": false,
    "service": {
      "name": "my-plugin",
      "namespace": "opendatahub",
      "port": 8080
    }
  },
  "proxyService": [
    {
      "path": "/my-plugin/api",
      "pathRewrite": "/api",
      "authorize": true,
      "tls": false,
      "service": {
        "name": "my-plugin-api",
        "namespace": "opendatahub",
        "port": 3000
      }
    }
  ]
}
```

Key points:
- `backend` controls how the frontend remote is loaded. The dashboard proxies `/_mf/{name}/*` to the `backend.service`.
- Each `proxyService` entry has its **own** `service`, `authorize`, and `tls` settings — they are independent of `backend`.
- A module can have `proxyService` without `backend` (API-only proxy, no frontend remote).
- `headers` (optional `Record<string, string>`) can be set on either `backend` or individual `proxyService` entries for custom header forwarding.

**Old format** (deprecated, still supported):

```json
{
  "name": "myPlugin",
  "remoteEntry": "/remoteEntry.js",
  "authorize": true,
  "tls": false,
  "service": { "name": "my-plugin", "namespace": "opendatahub", "port": 8080 },
  "proxy": [{ "path": "/my-plugin/api", "pathRewrite": "/api" }]
}
```

The backend automatically detects old-format entries (by checking for top-level `remoteEntry`) and converts them to the new format.

### Deployment Models for Plugins

Looking at the current federation ConfigMap, plugins run in one of three ways:

**A. Sidecar containers** — added to the same pod as the dashboard. Used by most internal plugins. The dashboard's Kubernetes Service exposes additional ports. In the federation config, the `service.name` points to `odh-dashboard`:

| Plugin | Port |
|---|---|
| model-registry | 8043 |
| gen-ai | 8143 |
| maas | 8243 |
| mlflow | 8343 |
| eval-hub | 8543 |
| automl | 8643 |
| autorag | 8743 |
| agent-ops | 8843 |

**B. Separate Kubernetes Services** — independent Deployments with their own Services. Used by `mlflowEmbedded` (`service.name: "mlflow"`, port 8443). The dashboard backend proxies to them via Kubernetes internal DNS.

**C. Proxy-only** — no frontend remote, only API proxying. Used by Perses (`service.name: "data-science-perses"`, port 8080). These entries have `proxyService` but no `backend`.

### Who Manages the Config

The `federation-config` ConfigMap is maintained in the dashboard's own Git manifests and applied by kustomize during deployment. The ODH operator deploys the dashboard using these manifests, so it transitively applies the federation config.

To modify which plugins are loaded, you update the ConfigMap either by:
- Editing the manifest YAML in Git and redeploying
- Directly editing the ConfigMap on the cluster with `oc edit configmap federation-config`
- Setting `MODULE_FEDERATION_CONFIG` as an environment variable on the dashboard Deployment (useful when the operator reconciles the ConfigMap)

---

## 2. Recipe: How to Add Your Own Extension

### Option A: Add to the monorepo (build-time + runtime)

This is the standard approach used by all current plugins. Your module lives in `packages/` and is both bundled at build time and loadable at runtime.

**Step 1**: Scaffold the module from the repo root:
```bash
cd packages
npx mod-arch-installer -n my-module
```

**Step 2**: Update identifiers — replace placeholder names with your module name in:
- `packages/my-module/package.json` (name, module-federation config)
- `packages/my-module/frontend/src/odh/extensions.ts`
- `packages/my-module/frontend/config/moduleFederation.js`

**Step 3**: Configure `module-federation` in `packages/my-module/package.json`:
```json
"module-federation": {
  "name": "myModule",
  "backend": {
    "remoteEntry": "/remoteEntry.js",
    "authorize": true,
    "tls": true,
    "service": {
      "name": "odh-dashboard",
      "namespace": "opendatahub",
      "port": 8943
    },
    "localService": {
      "host": "localhost",
      "port": 9200
    }
  },
  "proxyService": [
    {
      "path": "/my-module/api",
      "pathRewrite": "/api",
      "authorize": true,
      "tls": true,
      "service": {
        "name": "odh-dashboard",
        "namespace": "opendatahub",
        "port": 8943
      }
    }
  ]
}
```

**Step 4**: Define your extensions in `packages/my-module/extensions.ts`:
```typescript
import type { AreaExtension, HrefNavItemExtension, RouteExtension } from '@odh-dashboard/plugin-core/extension-points';

const extensions: (AreaExtension | HrefNavItemExtension | RouteExtension)[] = [
  {
    type: 'app.area',
    properties: {
      id: 'my-module',
      featureFlags: ['myModuleFlag'],
    },
  },
  {
    type: 'app.navigation/href',
    flags: { required: ['my-module'] },
    properties: {
      id: 'my-module-nav',
      title: 'My Module',
      href: '/my-module',
      section: 'develop-and-train',
      path: '/my-module/*',
    },
  },
  {
    type: 'app.route',
    flags: { required: ['my-module'] },
    properties: {
      path: '/my-module/*',
      component: () => import('./MyModuleRoot'),
    },
  },
];
export default extensions;
```

**Step 5**: Add a feature flag in `frontend/src/concepts/areas/const.ts` if gating is needed.

**Step 6**: Run locally:
```bash
# Terminal 1
cd frontend && npm run start:dev
# Terminal 2
cd backend && npm run start:dev
# Terminal 3
cd packages/my-module && make dev-start-federated
```

**Step 7**: Build the container image for your module and push it to a registry.

**Step 8**: Deploy — add your module to the cluster:
  - Update the `federation-config` ConfigMap to include your module entry
  - Either add a sidecar container to the dashboard Deployment, or create a separate Deployment + Service for your module
  - If sidecar: add a port to the `odh-dashboard` Service
  - Restart/redeploy the dashboard pod

### Option B: Standalone plugin (runtime only, no monorepo changes)

If you want to extend an already-deployed ODH Dashboard without touching the monorepo code. Your plugin runs as its own container and is discovered at runtime.

For working examples of this approach, see the [Example Community Plugins](#5-example-community-plugins) section.

#### Critical constraint: unpublished type packages

`@odh-dashboard/plugin-core` and `@odh-dashboard/internal` are both marked `"private": true` and **not published to npm**. This means a truly standalone plugin cannot `npm install` them. You have three workarounds:

1. **Copy the type definitions** — The extension contract is a simple JSON shape. You can define the types yourself (see below). At runtime, the dashboard only checks `extension.type` string values and `extension.properties` shape — there is no class instantiation or instanceof check.
2. **Reference the monorepo as a git dependency** — `npm install github:opendatahub-io/odh-dashboard#main` and import from the packages directory. Fragile but works.
3. **Work within the monorepo** (Option A) — This is the path of least resistance and what all current plugins do.

#### Extension type shapes (for standalone use)

The dashboard loads your `./extensions` module and expects a default export of an array of objects with this shape. No special classes or SDK calls — just plain objects:

```typescript
// Minimal type definitions you can copy into your standalone project.
// These match what the dashboard host expects at runtime.

type CodeRef<T = any> = () => Promise<{ default: T }>;

interface ExtensionBase<Type extends string, Props> {
  type: Type;
  properties: Props;
  flags?: {
    required?: string[];
    disallowed?: string[];
  };
}

// Registers a route in the dashboard
type RouteExtension = ExtensionBase<'app.route', {
  path: string;
  component: CodeRef<React.ComponentType<any>>;
}>;

// Adds a link to the sidebar navigation
type HrefNavItemExtension = ExtensionBase<'app.navigation/href', {
  id: string;
  title: string;
  href: string;
  section?: string;
  path?: string;
  group?: string;
  label?: string;
  iconRef?: CodeRef;
  statusProviderId?: string;
  dataAttributes?: Record<string, string>;
}>;

// Adds a collapsible section to the sidebar
type NavSectionExtension = ExtensionBase<'app.navigation/section', {
  id: string;
  title: string;
  section?: string;
  group?: string;
  iconRef?: CodeRef;
  label?: string;
  dataAttributes?: Record<string, string>;
}>;

// Declares a feature area (used for feature-flag gating)
type AreaExtension = ExtensionBase<'app.area', {
  id: string;
  featureFlags?: string[];
  reliantAreas?: string[];
}>;

// Creates a tabbed page that appears as a navigation item
type TabRoutePageExtension = ExtensionBase<'app.tab-route/page', {
  id: string;
  title: string;
  href: string;
  path: string;
  section?: string;
  group?: string;
  objectType?: string;
  alwaysShowTabBar?: boolean;
}>;

// Adds a tab to a tabbed page
type TabRouteTabExtension = ExtensionBase<'app.tab-route/tab', {
  pageId: string;
  id: string;
  title: string;
  component: CodeRef;
  group?: string;
  singleTabTitle?: string;
  objectType?: string;
}>;

type Extension = RouteExtension | HrefNavItemExtension | NavSectionExtension
  | AreaExtension | TabRoutePageExtension | TabRouteTabExtension;
```

The existing dashboard navigation sections you can slot into (the `section` property) include:
- `home`
- `ai-hub`
- `develop-and-train`
- `deploy-and-monitor`
- `observe-and-monitor`
- `applications`
- `settings`

You can also create your own section using a `NavSectionExtension` (see the kueue-visualizer example which creates a `community-plugins` section).

#### Step-by-step guide

**Step 1 — Scaffold the project**

Create a minimal webpack + React + TypeScript project. The critical file structure:

```
my-plugin/
├── src/
│   ├── rhoai/
│   │   └── extensions.ts      # Extension declarations (default export)
│   ├── app/
│   │   └── MyPluginPage.tsx   # Your main React component
│   ├── bootstrap.tsx          # Async bootstrap (required for MF)
│   └── index.ts               # Webpack entry (imports bootstrap)
├── config/
│   ├── webpack.common.js
│   ├── webpack.dev.js
│   └── webpack.prod.js
├── package.json
├── tsconfig.json
├── Containerfile
├── chart/                     # Helm chart for deployment
└── plugin.yaml                # Plugin metadata
```

**Step 2 — Set up package.json with matching dependency versions**

You must match the versions used by the dashboard host for shared singleton dependencies. Check the dashboard's `frontend/package.json` for exact versions. As of this codebase:

```json
{
  "name": "my-plugin",
  "private": true,
  "module-federation": {
    "name": "myPlugin",
    "remoteEntry": "remoteEntry.js",
    "authorize": false,
    "tls": false,
    "local": { "host": "localhost", "port": 9111 },
    "service": { "name": "odh-dashboard", "port": 8080 }
  },
  "scripts": {
    "build": "webpack --config config/webpack.prod.js",
    "start:dev": "webpack serve --config config/webpack.dev.js",
    "test": "jest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^7.17.0",
    "@patternfly/react-core": "^6.4.1",
    "@patternfly/react-icons": "^6.4.0",
    "@openshift/dynamic-plugin-sdk": "^5.0.1"
  },
  "devDependencies": {
    "webpack": "^5.x",
    "webpack-cli": "^5.x",
    "webpack-dev-server": "^5.x",
    "ts-loader": "^9.x",
    "typescript": "^5.x",
    "style-loader": "^4.x",
    "css-loader": "^7.x",
    "html-webpack-plugin": "^5.x"
  }
}
```

**Step 3 — Configure webpack**

Standalone plugins can use webpack's **built-in** `ModuleFederationPlugin` (from `webpack.container`) — you do not need `@module-federation/enhanced`. This is simpler and compatible with the dashboard host.

```javascript
// config/webpack.common.js
const { ModuleFederationPlugin } = require('webpack').container;
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
  entry: './src/index.ts',
  output: {
    publicPath: 'auto',
    filename: '[name].[contenthash].js',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  module: {
    rules: [
      { test: /\.tsx?$/, use: 'ts-loader', exclude: /node_modules/ },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, '../src/index.html'),
    }),
    new ModuleFederationPlugin({
      name: 'myPlugin',             // Must match the "name" in the ConfigMap
      filename: 'remoteEntry.js',
      exposes: {
        './extensions': './src/rhoai/extensions.ts',  // Required — the host loads this
      },
      shared: {
        // These are provided by the host at runtime — your plugin does NOT
        // bundle them. The host shares them as singletons.
        react:                  { singleton: true, requiredVersion: '^18' },
        'react-dom':            { singleton: true, requiredVersion: '^18' },
        'react-router-dom':     { singleton: true, requiredVersion: '^7' },
        '@patternfly/react-core': { singleton: true, requiredVersion: '^6' },
        '@openshift/dynamic-plugin-sdk': {
          singleton: true, requiredVersion: '^5',
        },
      },
    }),
  ],
};
```

Additional shared dependencies to add if your plugin uses them:
- `@patternfly/react-icons` — shared as singleton by the host
- `@patternfly/react-table` — if using PatternFly tables
- `@patternfly/react-topology` — if using topology visualization
- `react-router` — shared separately from `react-router-dom` by the host

**Step 4 — Set up the entry point (required for Module Federation)**

Module Federation requires an async bootstrap pattern. Your entry point must dynamically import the actual application:

```typescript
// src/index.ts — thin entry
import('./bootstrap');
```

```tsx
// src/bootstrap.tsx — actual app mount
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
```

**Step 5 — Define your extensions**

```typescript
// src/rhoai/extensions.ts
const extensions = [
  // 1. Declare a feature area (optional — only if you need flag gating)
  {
    type: 'app.area' as const,
    properties: {
      id: 'my-plugin-area',
      featureFlags: [] as string[],
    },
  },

  // 2. Add a sidebar navigation link
  {
    type: 'app.navigation/href' as const,
    properties: {
      id: 'my-plugin-nav',
      title: 'My Plugin',
      href: '/my-plugin',
      path: '/my-plugin/*',
      section: 'develop-and-train',
    },
  },

  // 3. Register a route so the component renders when the user navigates there
  {
    type: 'app.route' as const,
    properties: {
      path: '/my-plugin/*',
      component: () => import('../app/MyPluginPage'),   // Lazy-loaded
    },
  },
];

export default extensions;
```

```tsx
// src/app/MyPluginPage.tsx
import React from 'react';
import {
  Page, PageSection, Title, Content,
} from '@patternfly/react-core';

const MyPluginPage: React.FC = () => (
  <Page>
    <PageSection variant="light">
      <Content>
        <Title headingLevel="h1">My Plugin</Title>
        <p>This page is served from a separate container.</p>
      </Content>
    </PageSection>
  </Page>
);

export default MyPluginPage;
```

**Step 6 — Containerize**

Your container needs to serve the built static files (especially `remoteEntry.js` and the JS chunks). Use nginx with non-root user for OpenShift compatibility:

```dockerfile
# Containerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
RUN echo 'server { \
    listen 8080; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location /remoteEntry.js { \
        add_header Access-Control-Allow-Origin *; \
    } \
}' > /etc/nginx/conf.d/default.conf

RUN chown -R 1001:0 /var/cache/nginx /var/run /var/log/nginx /usr/share/nginx/html \
    && chmod -R g=u /var/cache/nginx /var/run /var/log/nginx

EXPOSE 8080
USER 1001
CMD ["nginx", "-g", "daemon off;"]
```

Build and push:
```bash
podman build -t quay.io/myorg/my-plugin:latest -f Containerfile .
podman push quay.io/myorg/my-plugin:latest
```

**Step 7 — Deploy to the cluster**

You can use raw Kubernetes manifests or a Helm chart. Both example community plugins use Helm charts — see their `chart/` directories for templates.

With raw manifests:

```yaml
# my-plugin-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-plugin
  namespace: opendatahub
  labels:
    app: my-plugin
spec:
  replicas: 1
  selector:
    matchLabels:
      app: my-plugin
  template:
    metadata:
      labels:
        app: my-plugin
    spec:
      containers:
        - name: my-plugin
          image: quay.io/myorg/my-plugin:latest
          ports:
            - containerPort: 8080
          securityContext:
            runAsNonRoot: true
            runAsUser: 1001
            allowPrivilegeEscalation: false
            capabilities:
              drop: ["ALL"]
            seccompProfile:
              type: RuntimeDefault
          livenessProbe:
            httpGet:
              path: /
              port: 8080
          readinessProbe:
            httpGet:
              path: /
              port: 8080
          resources:
            requests:
              cpu: 50m
              memory: 64Mi
            limits:
              cpu: 100m
              memory: 128Mi
---
apiVersion: v1
kind: Service
metadata:
  name: my-plugin
  namespace: opendatahub
spec:
  selector:
    app: my-plugin
  ports:
    - port: 8080
      targetPort: 8080
      protocol: TCP
```

```bash
oc apply -f my-plugin-deployment.yaml
```

**Step 8 — Register in the federation config**

The dashboard discovers plugins via the `MODULE_FEDERATION_CONFIG` environment variable. If the ODH operator reconciles the `federation-config` ConfigMap, you may need to set the env var directly on the Deployment instead.

**Option A: Edit the ConfigMap** (if the operator doesn't reconcile it):

```bash
oc edit configmap federation-config -n opendatahub
```

Add to the JSON array in `module-federation-config.json` (new format):

```json
{
  "name": "myPlugin",
  "backend": {
    "remoteEntry": "/remoteEntry.js",
    "authorize": false,
    "tls": false,
    "service": {
      "name": "my-plugin",
      "namespace": "opendatahub",
      "port": 8080
    }
  }
}
```

Or with the old format (still supported):

```json
{
  "name": "myPlugin",
  "remoteEntry": "/remoteEntry.js",
  "authorize": false,
  "tls": false,
  "service": {
    "name": "my-plugin",
    "namespace": "opendatahub",
    "port": 8080
  }
}
```

**Option B: Extend the `MODULE_FEDERATION_CONFIG` env var** (if the operator reconciles the ConfigMap):

```bash
# Get current config
CURRENT=$(oc get deploy rhods-dashboard -n redhat-ods-applications \
  -o jsonpath='{.spec.template.spec.containers[0].env[?(@.name=="MODULE_FEDERATION_CONFIG")].value}')

# Append your plugin (using Python to merge JSON arrays)
NEW=$(python3 -c "
import json, sys
current = json.loads('$CURRENT') if '$CURRENT' else []
current.append({
  'name': 'myPlugin',
  'backend': {
    'remoteEntry': '/remoteEntry.js',
    'authorize': False,
    'tls': False,
    'service': {'name': 'my-plugin', 'namespace': 'opendatahub', 'port': 8080}
  }
})
print(json.dumps(current))
")

# Set the env var
oc set env deploy/rhods-dashboard -n redhat-ods-applications "MODULE_FEDERATION_CONFIG=$NEW"
```

If your plugin also has its own API backend (BFF), add a `proxyService` entry:

```json
{
  "name": "myPlugin",
  "backend": {
    "remoteEntry": "/remoteEntry.js",
    "authorize": false,
    "tls": false,
    "service": {
      "name": "my-plugin",
      "namespace": "opendatahub",
      "port": 8080
    }
  },
  "proxyService": [
    {
      "path": "/my-plugin/api",
      "pathRewrite": "/api",
      "authorize": true,
      "tls": false,
      "service": {
        "name": "my-plugin-api",
        "namespace": "opendatahub",
        "port": 3000
      }
    }
  ]
}
```

**Step 9 — Restart the dashboard**

```bash
oc rollout restart deployment/odh-dashboard -n opendatahub
```

After restart, the dashboard backend will:
- Proxy `/_mf/myPlugin/*` to `my-plugin.opendatahub.svc.cluster.local:8080`
- Load `remoteEntry.js` from your service
- Dynamically import your `./extensions` module
- Merge your nav items and routes into the dashboard UI

#### What happens at runtime (request flow)

```
Browser                     Dashboard Backend              Your Plugin Service
  |                              |                              |
  |  GET /                       |                              |
  |  --------------------------> |                              |
  |  <-- HTML with               |                              |
  |      <script id="mf-remotes-json">                         |
  |      [{"name":"myPlugin","remoteEntry":"/remoteEntry.js"}] |
  |                              |                              |
  |  GET /_mf/myPlugin/remoteEntry.js                          |
  |  --------------------------> |  GET /remoteEntry.js         |
  |                              |  --------------------------> |
  |                              |  <-- remoteEntry.js          |
  |  <-- remoteEntry.js          |                              |
  |                              |                              |
  |  (MF runtime resolves        |                              |
  |   ./extensions, loads chunks)|                              |
  |  GET /_mf/myPlugin/chunk.js  |  GET /chunk.js               |
  |  --------------------------> |  --------------------------> |
  |  <-- chunk.js                |  <-- chunk.js                |
  |                              |                              |
  |  Navigation + routes now     |                              |
  |  include your plugin         |                              |
```

#### Important considerations

- **Dependency version alignment**: Shared singleton dependencies (React, PatternFly, react-router) must be version-compatible with the deployed dashboard. Mismatches cause runtime errors. Check the dashboard's `frontend/package.json` for versions.
- **Feature flags**: If your extensions use `flags: { required: ['someFlag'] }`, that flag must exist in the dashboard's area system. If you omit the `flags` property entirely, your extensions are always active (simplest approach for standalone plugins).
- **TLS**: In production ODH/RHOAI deployments, inter-service communication typically uses TLS with cluster-internal certificates. Set `"tls": true` and ensure your container serves over HTTPS if required. For initial testing, `"tls": false` with plain HTTP works if the cluster NetworkPolicy allows it.
- **Authorization**: Set `"authorize": true` if your plugin's backend needs the user's auth token. The dashboard backend will forward the user's OpenShift token in the `Authorization: Bearer <token>` header of the proxied request.
- **No feature flag registration from outside**: A standalone plugin cannot add new entries to the dashboard's `SupportedArea` enum or `dashboardConfig`. If you need a feature flag, either don't use one (extensions are always shown), or coordinate with the dashboard team to add the flag upstream.
- **OpenShift security**: Run containers as non-root (user 1001), drop all capabilities, and set `seccompProfile: RuntimeDefault` to comply with OpenShift's `restricted-v2` SCC.

---

## 3. Dashboard Backend Features Available to Your Plugin

Since your plugin's frontend code runs inside the same browser page as the dashboard, it shares the same origin and can call all dashboard backend APIs directly via `fetch()`. Your plugin can also optionally have its own backend (BFF) that receives the user's auth token.

### 3.1 Authentication & the Token Flow

The ODH Dashboard sits behind an OAuth proxy (or kube-rbac-proxy) that authenticates users. The flow:

1. User authenticates via OpenShift OAuth
2. The OAuth proxy sets the `x-forwarded-access-token` header with the user's OpenShift Bearer token on every request to the dashboard backend
3. The dashboard backend extracts this token via `getDirectCallOptions()` (`backend/src/utils/directCallUtils.ts`) and uses it for Kubernetes API calls on the user's behalf
4. When the dashboard backend proxies to your plugin's service and `authorize: true` is set, it calls `setAuthorizationHeader()` (`backend/src/utils/proxy.ts`) which converts the user's `x-forwarded-access-token` into an `Authorization: Bearer <token>` header on the proxied request

**What your plugin's BFF receives** (when `authorize: true`):
- `Authorization: Bearer <user-openshift-token>` — the actual user's OpenShift token, not a service account token
- Any custom headers configured in the `headers` field of the ConfigMap entry

**What your plugin's BFF can do with the token**:
- Make Kubernetes API calls as the authenticated user (respecting their RBAC)
- Call `GET /apis/user.openshift.io/v1/users/~` to get user details
- Perform SelfSubjectAccessReview to check user permissions

### 3.2 Dashboard Backend APIs (callable from your plugin's frontend)

Your plugin's React components run in the browser at the same origin as the dashboard. This means they can call any `/api/*` endpoint directly. Key endpoints:

#### User & Status
| Endpoint | Method | Returns |
|---|---|---|
| `/api/status` | GET | `{ kube: { userName, userID, isAdmin, isAllowed, clusterID, clusterBranding, namespace, serverURL, currentContext, currentUser } }` |
| `/api/config` | GET | Dashboard configuration |
| `/api/dashboardConfig` | GET | `OdhDashboardConfig` CR (feature flags, settings) |

#### Kubernetes Pass-Through
| Endpoint | Method | Returns |
|---|---|---|
| `/api/k8s/*` | GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS | Direct proxy to the Kubernetes API. Actions are performed with the user's RBAC permissions. |

Example: `fetch('/api/k8s/apis/project.openshift.io/v1/projects')` lists the user's projects.

See [Section 4](#4-interacting-with-the-cluster-from-your-plugin) for detailed usage patterns.

#### Other APIs
| Endpoint | Purpose |
|---|---|
| `/api/components` | Dashboard components (OdhApplication CRs) |
| `/api/namespaces` | Accessible namespaces |
| `/api/notebooks` | Notebook resources |
| `/api/servingRuntimes` | KServe serving runtimes |
| `/api/route` | OpenShift routes |
| `/api/prometheus` | Prometheus metrics |
| `/api/cluster-settings` | Cluster config |
| `/api/connection-types` | Connection type definitions |
| `/api/health` | Backend health check |
| `/api/dsc` | DataScienceCluster CR |
| `/api/dsci` | DSCInitialization CR |
| `/api/integrations` | Integration configurations |
| `/api/modelRegistries` | Model Registry instances |
| `/api/service/pipelines` | ML Pipelines service proxy |
| `/api/service/modelregistry` | Model Registry service proxy |
| `/api/service/trustyai` | TrustyAI service proxy |

### 3.3 Using Your Own Backend (BFF Pattern)

If your plugin needs its own API backend (e.g., to talk to a third-party service), add a `proxyService` entry in the ConfigMap. The dashboard backend will then proxy requests from a URL path you choose to your backend service.

**Example**: Your plugin makes `fetch('/my-plugin/api/data')` → dashboard backend rewrites to `/api/data` → forwards to `my-plugin-api.opendatahub.svc.cluster.local:3000/api/data` with the user's Bearer token (if `authorize: true`).

Your BFF container can then:
- Extract the user token from the `Authorization` header
- Use it to call the Kubernetes API on the user's behalf
- Call external services (ML platforms, databases, etc.)

### 3.4 What React Hooks and Packages Are Available

**Available via Module Federation shared dependencies**: If a dependency is listed as `shared: { singleton: true }` in the host's webpack config, your plugin gets the host's instance at runtime. This includes React, react-router, PatternFly, and `@openshift/dynamic-plugin-sdk`.

The host also shares all `@odh-dashboard/*` runtime packages as singletons (collected automatically by `frontend/config/getRuntimeOdhPackages.js`). At runtime, if your plugin requests any of these packages, the host provides its copy. However, since these packages are not published to npm, a standalone plugin cannot import them at **build time** for type checking.

**Not directly available from outside the monorepo**:
- `useUser()`, `useAccessReview()`, `useNotification()`, `useAppContext()` — these live in `@odh-dashboard/internal`, which is not published
- Any hooks or components from `@odh-dashboard/internal`

**Workarounds for a standalone plugin**:
1. **Call `/api/status` directly** — Instead of `useUser()`, do `fetch('/api/status')` in your component to get user info
2. **Use the K8s pass-through** — Instead of dedicated hooks, call `/api/k8s/...` endpoints (see [Section 4](#4-interacting-with-the-cluster-from-your-plugin))
3. **Use PatternFly directly** — For notifications, use PatternFly's `Alert` or `AlertGroup` components instead of the dashboard's `useNotification()` hook

---

## 4. Interacting with the Cluster from Your Plugin

Your plugin's frontend runs inside the dashboard's browser page and can use the dashboard's backend as a proxy to the Kubernetes API. All requests through `/api/k8s/*` are authenticated as the logged-in user — the dashboard backend automatically forwards the user's OpenShift token.

### 4.1 Getting User Information

Call `/api/status` to get information about the currently logged-in user:

```typescript
type KubeStatus = {
  currentContext: string;
  currentUser: string;
  namespace: string;
  userName: string;
  userID: string;
  clusterID: string;
  clusterBranding: string;
  isAdmin: boolean;
  isAllowed: boolean;
  serverURL: string;
};

async function getCurrentUser(): Promise<KubeStatus> {
  const response = await fetch('/api/status');
  if (!response.ok) {
    throw new Error(`Failed to fetch status: ${response.status}`);
  }
  const data = await response.json();
  return data.kube;
}
```

As a React hook:

```typescript
import { useState, useEffect } from 'react';

function useCurrentUser() {
  const [user, setUser] = useState<KubeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => { setUser(data.kube); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  return { user, loading, error };
}
```

### 4.2 Reading Kubernetes Resources

The `/api/k8s/*` endpoint is a pass-through proxy to the Kubernetes API. It supports all HTTP methods and the user's RBAC permissions are enforced by the cluster.

The URL pattern is: `/api/k8s/{kubernetes-api-path}`

Where `{kubernetes-api-path}` is the standard Kubernetes API path you would use with `kubectl` or `curl`.

**Examples:**

```typescript
// List the user's projects
const projects = await fetch('/api/k8s/apis/project.openshift.io/v1/projects')
  .then((res) => res.json());

// List pods in a namespace
const pods = await fetch('/api/k8s/api/v1/namespaces/my-project/pods')
  .then((res) => res.json());

// Get a specific deployment
const deployment = await fetch(
  '/api/k8s/apis/apps/v1/namespaces/my-project/deployments/my-app'
).then((res) => res.json());

// List custom resources (e.g., Kueue ClusterQueues)
const queues = await fetch(
  '/api/k8s/apis/kueue.x-k8s.io/v1beta1/clusterqueues'
).then((res) => res.json());
```

As a reusable React hook (pattern from the [kueue-visualizer](https://github.com/rh-ai-community-plugins/kueue-visualizer) plugin):

```typescript
import { useState, useEffect, useCallback } from 'react';

function useK8sResource<T>(apiPath: string) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    fetch(`/api/k8s${apiPath}`)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json();
      })
      .then((list) => { setItems(list.items ?? []); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [apiPath]);

  useEffect(() => { refresh(); }, [refresh]);

  return { items, loading, error, refresh };
}

// Usage:
const { items: pods, loading } = useK8sResource<Pod>(
  '/api/v1/namespaces/my-project/pods'
);
```

### 4.3 Creating and Modifying Kubernetes Resources

The same `/api/k8s/*` proxy supports POST, PUT, PATCH, and DELETE. The user must have the appropriate RBAC permissions for the operation.

**Creating a Deployment:**

```typescript
async function createDeployment(namespace: string, name: string, image: string) {
  const deployment = {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: { name, namespace },
    spec: {
      replicas: 1,
      selector: { matchLabels: { app: name } },
      template: {
        metadata: { labels: { app: name } },
        spec: {
          containers: [{
            name,
            image,
            ports: [{ containerPort: 8080 }],
          }],
        },
      },
    },
  };

  const response = await fetch(
    `/api/k8s/apis/apps/v1/namespaces/${namespace}/deployments`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deployment),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Failed to create deployment: ${response.status}`);
  }
  return response.json();
}
```

**Creating a Service:**

```typescript
async function createService(namespace: string, name: string, port: number) {
  const service = {
    apiVersion: 'v1',
    kind: 'Service',
    metadata: { name, namespace },
    spec: {
      selector: { app: name },
      ports: [{ port, targetPort: port, protocol: 'TCP' }],
    },
  };

  const response = await fetch(
    `/api/k8s/api/v1/namespaces/${namespace}/services`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(service),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Failed to create service: ${response.status}`);
  }
  return response.json();
}
```

**Deleting a resource:**

```typescript
async function deleteDeployment(namespace: string, name: string) {
  const response = await fetch(
    `/api/k8s/apis/apps/v1/namespaces/${namespace}/deployments/${name}`,
    { method: 'DELETE' },
  );
  if (!response.ok) {
    throw new Error(`Failed to delete deployment: ${response.status}`);
  }
}
```

### 4.4 Checking User Permissions (RBAC)

Before creating resources, check whether the user has the required permissions using a SelfSubjectAccessReview:

```typescript
async function canUserCreate(
  namespace: string,
  group: string,
  resource: string,
): Promise<boolean> {
  const review = {
    apiVersion: 'authorization.k8s.io/v1',
    kind: 'SelfSubjectAccessReview',
    spec: {
      resourceAttributes: {
        namespace,
        verb: 'create',
        group,
        resource,
      },
    },
  };

  const response = await fetch(
    '/api/k8s/apis/authorization.k8s.io/v1/selfsubjectaccessreviews',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(review),
    },
  );

  const result = await response.json();
  return result.status?.allowed === true;
}

// Check if user can create deployments in a namespace
const canDeploy = await canUserCreate('my-project', 'apps', 'deployments');
```

As a React hook:

```typescript
function useCanCreate(namespace: string, group: string, resource: string) {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    canUserCreate(namespace, group, resource)
      .then((result) => { setAllowed(result); setLoading(false); })
      .catch(() => { setAllowed(false); setLoading(false); });
  }, [namespace, group, resource]);

  return { allowed, loading };
}
```

### 4.5 Reading Dashboard Configuration

```typescript
// Get dashboard feature flags and settings
const dashboardConfig = await fetch('/api/dashboardConfig').then((res) => res.json());

// Get basic dashboard config
const config = await fetch('/api/config').then((res) => res.json());
```

---

## 5. Example Community Plugins

Two community plugins demonstrate the standalone approach:

### hello-plugin-world

**Repository**: [github.com/rh-ai-community-plugins/hello-plugin-world](https://github.com/rh-ai-community-plugins/hello-plugin-world)

A minimal "Hello World" plugin that demonstrates:
- Project structure with `src/rhoai/extensions.ts` for extension declarations
- Webpack Module Federation config using `webpack.container.ModuleFederationPlugin`
- Three extensions: `app.area`, `app.navigation/href`, `app.route`
- `Containerfile` with nginx serving static files on port 8080 as non-root user 1001
- Helm chart in `chart/` for deployment
- No dashboard API interaction — purely presentational

### kueue-visualizer

**Repository**: [github.com/rh-ai-community-plugins/kueue-visualizer](https://github.com/rh-ai-community-plugins/kueue-visualizer)

A more substantial plugin that demonstrates:
- Multiple pages with separate routes (Queue Infrastructure, Workloads)
- Creating a custom navigation section (`app.navigation/section`)
- **Reading Kubernetes resources** via the `/api/k8s/*` pass-through proxy — fetches Kueue CRDs (ClusterQueues, LocalQueues, Workloads, ResourceFlavors) and core API resources (Namespaces)
- React hooks pattern for K8s data fetching (`useKueueResources.ts`)
- PatternFly Topology visualization
- Helm chart with ClusterRole for read-only RBAC
- OpenShift security best practices (restricted-v2 SCC compliance)

The kueue-visualizer is the best reference for plugins that need to read cluster data. Its `src/app/hooks/useKueueResources.ts` shows the recommended pattern for calling `/api/k8s/*` endpoints.

---

## Key Reference Files

| File | Purpose |
|---|---|
| `manifests/modular-architecture/federation-configmap.yaml` | ConfigMap defining which modules are loaded at runtime |
| `manifests/modular-architecture/deployment.yaml` | Kustomize patch injecting `MODULE_FEDERATION_CONFIG` env var + sidecar containers |
| `packages/app-config/src/types.ts` | TypeScript types for `ModuleFederationConfig` and `ProxyService` |
| `packages/app-config/src/module-federation.ts` | Config parsing and old→new format conversion |
| `backend/src/routes/module-federation.ts` | Backend proxy registration for remotes and proxy services |
| `backend/src/routes/root.ts` | HTML injection of remote list (`mf-remotes-json` script tag) |
| `backend/src/utils/proxy.ts` | Proxy logic and auth header forwarding (`registerProxy`, `setAuthorizationHeader`) |
| `backend/src/utils/directCallUtils.ts` | User token extraction from `x-forwarded-access-token` |
| `backend/src/routes/api/k8s/index.ts` | Kubernetes API pass-through proxy |
| `backend/src/routes/api/status/statusUtils.ts` | User status endpoint implementation |
| `frontend/src/plugins/useAppExtensions.ts` | Frontend runtime module loading |
| `frontend/config/moduleFederation.js` | Host Module Federation webpack config with shared singletons |
| `frontend/config/getRuntimeOdhPackages.js` | Auto-collection of `@odh-dashboard/*` shared packages |
| `frontend/src/app/navigation/ExtensibleNav.tsx` | Dynamic navigation rendering |
| `frontend/src/app/AppRoutes.tsx` | Dynamic route rendering |
| `packages/plugin-core/src/extension-points/` | Extension type definitions |
| `docs/module-federation.md` | Official module federation docs |
| `docs/extensibility.md` | Extension points, code refs, hooks, best practices |
| `docs/onboard-modular-architecture.md` | Official onboarding guide for monorepo modules |

