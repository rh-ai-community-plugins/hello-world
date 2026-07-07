# Local Development Environment Setup

This guide walks through setting up a complete local development environment for plugin development, including the RHOAI Dashboard itself running in dev mode so you can see your plugin integrating in real time with hot reload.

---

## Prerequisites

Before starting, ensure you have:

- **Node.js 20+** installed (check with `node --version`)
- **npm** (comes with Node.js)
- **`oc` CLI** installed and configured ([install guide](https://docs.openshift.com/container-platform/latest/cli_reference/openshift_cli/getting-started-cli.html))
- **Access to an OpenShift cluster** with Red Hat OpenShift AI (RHOAI) installed
- **cluster-admin access** on the cluster (required for the dashboard backend dev mode)

---

## 1. Dashboard Setup

The plugin runs inside the RHOAI Dashboard, so you need the dashboard running locally first.

### Step 1: Clone the dashboard repository

```bash
git clone https://github.com/opendatahub-io/odh-dashboard.git
cd odh-dashboard
```

### Step 2: Switch to the desired version/tag

Check the [releases page](https://github.com/opendatahub-io/odh-dashboard/tags) for available versions. Currently recommended:

```bash
git checkout v3.4.4
```

### Step 3: Create your local environment file

```bash
cp env.local.example env.local
```

### Step 4: Install dependencies

```bash
npm install
```

### Step 5: Log into the cluster

You need cluster-admin access for the backend to function in dev mode:

```bash
oc login --server=https://<your-cluster-api-url>:6443
```

Verify access:

```bash
oc whoami
oc auth can-i create pods --all-namespaces   # Should return "yes" for cluster-admin
```

### Step 6: Start the dashboard (two terminals)

**Terminal 1 -- Backend:**

```bash
cd backend
npm run start:dev
```

**Terminal 2 -- Frontend:**

```bash
cd frontend
npm run start:dev
```

### Step 7: Verify

Open your browser to **http://localhost:4010**. You should see the RHOAI Dashboard.

---

## 2. Plugin Configuration

To make the dashboard discover and load your plugin, you need to add it to the `MODULE_FEDERATION_CONFIG` in the dashboard's `env.local` file.

### Add the plugin entry

Edit `env.local` in the odh-dashboard root and add (or update) the `MODULE_FEDERATION_CONFIG` variable with your plugin's entry:

```
MODULE_FEDERATION_CONFIG=[{"name":"helloWorld","backend":{"remoteEntry":"/remoteEntry.js","tls":false,"localService":{"host":"localhost","port":9112},"service":{"name":"placeholder","namespace":"opendatahub","port":8080}}}]
```

Or in readable JSON form, the entry looks like:

```json
{
  "name": "helloWorld",
  "backend": {
    "remoteEntry": "/remoteEntry.js",
    "tls": false,
    "localService": { "host": "localhost", "port": 9112 },
    "service": { "name": "placeholder", "namespace": "opendatahub", "port": 8080 }
  }
}
```

### Config field reference

| Field | Description |
|---|---|
| `name` | The Module Federation remote name. Must match the `name` in the plugin's webpack `ModuleFederationPlugin` config. |
| `backend.remoteEntry` | Path to the `remoteEntry.js` file served by the plugin's dev server. |
| `backend.tls` | Whether the plugin dev server uses HTTPS. Set to `false` for local development. |
| `backend.localService.host` | Hostname of the plugin dev server. Use `localhost` for local development. |
| `backend.localService.port` | Port the plugin dev server listens on. Must match the plugin's webpack dev server port. |
| `backend.service.name` | Kubernetes Service name used in production. Set to `placeholder` for local dev (the `localService` overrides it). |
| `backend.service.namespace` | Kubernetes namespace. Set to `opendatahub` (or your RHOAI namespace). |
| `backend.service.port` | Service port in production. Not used when `localService` is set. |

When `localService` is present, the dashboard backend proxies to that host/port instead of looking up the Kubernetes Service. This is what makes local plugin development work.

### Restart the dashboard

After changing `env.local`, restart both the backend and frontend terminals for the change to take effect.

---

## 3. Plugin Development Workflow

### Start the plugin dev server

From the plugin project root:

```bash
npm run start:dev
```

This starts the webpack dev server on port **9112** by default (configurable via the `PORT` environment variable):

```bash
# Use a custom port
PORT=9200 npm run start:dev
```

The dev server:
- Serves `remoteEntry.js` and all plugin chunks
- Supports **hot module replacement (HMR)** -- changes to your plugin's source code are reflected in the dashboard without a full page reload
- Runs at `http://localhost:9112` by default

### Typical workflow

1. Start the dashboard (backend + frontend) as described in section 1
2. Start the plugin dev server with `npm run start:dev`
3. Open `http://localhost:4010` in your browser
4. Navigate to the plugin's page in the dashboard sidebar
5. Edit plugin source files -- changes appear automatically via hot reload

### Port conventions

Each RHOAI plugin uses a unique dev port to avoid conflicts. When running the dashboard monorepo locally, these ports are used:

| Port | Plugin |
|---|---|
| 9100 | modelRegistry |
| 9102 | genAi |
| 9104 | maas |
| 9105 | notebooks |
| 9106 | evalHub |
| 9107 | autorag |
| 9108 | automl |
| 9110 | mlflow |
| 9111 | agentOps |

This project defaults to port **9112** to avoid conflicts with all of the above. If you are developing multiple community plugins simultaneously, choose a port above 9112 for each.

---

## 4. Troubleshooting

### Plugin does not appear in the dashboard sidebar

- Verify the plugin dev server is running and accessible at `http://localhost:9112/remoteEntry.js`
- Check the `MODULE_FEDERATION_CONFIG` in `env.local` -- the `name` must match the plugin's webpack config
- Ensure the `localService.port` matches the port your plugin dev server is running on
- Restart the dashboard backend after changing `env.local`

### "Shared module not found" or React version errors

- Your plugin's shared dependency versions must be compatible with the dashboard's versions. Check the dashboard's `frontend/package.json` for the exact versions of React, PatternFly, and react-router-dom.

### Backend fails to start

- Ensure you are logged into the cluster with `oc login` and have cluster-admin access
- Check that the OpenShift API server is reachable from your machine
- Try `oc whoami --show-server` to verify connectivity

### Hot reload not working

- Check the browser console for errors
- Ensure the plugin dev server is running (not just built)
- Try a hard refresh (Ctrl+Shift+R) if the module cache is stale
