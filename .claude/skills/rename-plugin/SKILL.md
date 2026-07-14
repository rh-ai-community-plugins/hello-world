---
name: rename-plugin
description: This skill should be used when the user asks to "rename this plugin", "create a new plugin from this seed", "fork this plugin", "customize plugin identifiers", "change the plugin name", or wants to transform the hello-world seed project into a new RHOAI community plugin. Use proactively whenever the user indicates they want to create a new plugin based on this project.
---

# Rename Plugin

Automate renaming all plugin-specific identifiers when creating a new RHOAI community plugin from the `hello-world` seed project. The script handles identifier replacement, prose de-seeding (removing demo/scaffold language), and automatic cleanup of seed-only artifacts.

## When to Use

- The user wants to create a new plugin from this seed/scaffold project
- The user wants to rename all `hello-world` / `HelloWorld` identifiers to a new plugin name
- The user asks to customize or fork this project for a new plugin

## How It Works

The `scripts/rename-plugin.js` script:

1. Derives all naming variants from a display name
2. Replaces identifiers across ~40 files and renames icon files
3. Updates icon initials, color, and component name
4. Replaces seed/scaffold/demo framing in documentation with factual language
5. Removes seed-only artifacts (the script itself, archives, COMMUNITY_PLUGINS.md, CHANGELOG history, this skill directory)
6. Prints post-rename steps

## Workflow

### Step 1: Gather the Plugin Name

Ask the user for the **display name** of their new plugin (e.g., "My Cool Plugin"). All other variants are derived automatically:

| Variant      | Example                |
|-------------|------------------------|
| kebab-case  | `my-cool-plugin`       |
| camelCase   | `myCoolPlugin`         |
| PascalCase  | `MyCoolPlugin`         |
| snake_case  | `my_cool_plugin`       |
| Display     | `My Cool Plugin`       |
| Initials    | `MC`                   |

The user may also specify:

- A custom **dev server port** (default: `9500`)
- Custom **icon initials** (default: derived from first letters of the display name)
- Custom **icon color** (default: deterministically picked from a palette based on the kebab name)

### Step 2: Run the Script

Run the rename script in non-interactive mode:

```bash
node scripts/rename-plugin.js --name "Plugin Display Name" --yes
```

The script performs three phases:

1. **Identifier replacement** — replaces `hello-world` / `HelloWorld` / `HelloIcon` across all source, config, chart, CI, build, and doc files
2. **Prose de-seeding** — replaces seed/scaffold/demo language ("reference implementation", "demonstrates", "example page", "seed project") with factual descriptions
3. **Seed cleanup** — deletes `scripts/rename-plugin.js` (itself), `docs/archives/`, `docs/architecture/COMMUNITY_PLUGINS.md`, `.claude/skills/rename-plugin/`, resets `CHANGELOG.md`, strips the "Automated Rename" section from `CUSTOMIZATION.md`, and removes the `rename-plugin` npm script

**Note:** After the script runs, this skill file no longer exists in the project.

Available flags for overrides:

| Flag            | Purpose                              |
|----------------|--------------------------------------|
| `--name`       | Display name (required)              |
| `--kebab`      | Override kebab-case                  |
| `--camel`      | Override camelCase                   |
| `--pascal`     | Override PascalCase                  |
| `--snake`      | Override snake_case                  |
| `--display`    | Override display name                |
| `--port`       | Override dev server port             |
| `--initials`   | Override icon initials               |
| `--icon-color` | Override icon color (hex, e.g. `#0066cc`) |
| `--dry-run`    | Preview changes without applying     |
| `--yes` / `-y` | Skip confirmation prompt             |

### Step 3: Regenerate Lock Files

After the script completes, run `npm install` in both the root and `bff/` directories to regenerate the lock files with the updated package names:

```bash
npm install && cd bff && npm install && cd ..
```

This ensures `package-lock.json` and `bff/package-lock.json` reflect the new package names set by the script.

### Step 4: Verify the Rename

Run verification:

```bash
npm run lint && npm test
```

Both must pass with zero errors. If either fails, inspect and fix the issue before proceeding.

### Step 5: Communicate Post-Rename Steps

The script prints a checklist of manual steps. Relay these to the user clearly:

1. **Update `MODULE_FEDERATION_CONFIG`** in the dashboard's environment — the `name` field must match the new `camelCase` identifier, and `proxyService.path` must match `/{kebab}/api`.
2. **Restart ALL services** — the dashboard, plugin dev server, and BFF must all be restarted. The dashboard caches federation config at startup.
3. **Update container image repositories** — replace `quay.io/OWNER/` placeholders in `chart/values.yaml` and `.github/workflows/build-push.yml`.
4. **Update `plugin.yaml`** — set the `remoteEntry` URL to point to the deployed image location.

## Example

User: "Create a new plugin called Model Monitor"

```bash
node scripts/rename-plugin.js --name "Model Monitor" --yes
```

This renames all identifiers (`hello-world` → `model-monitor`, `HelloWorld` → `ModelMonitor`, `HelloIcon` → `ModelMonitorIcon`, etc.), updates icon to "MM" initials, sets a deterministic icon color, removes seed prose and artifacts.

## What the Script Modifies

- **npm packages**: `package.json`, `bff/package.json`
- **Config**: `plugin.yaml`, `config/webpack.common.js`, `config/moduleFederation.js`, `config/webpack.dev.js`, `.env.development`
- **Source**: `src/index.html`, `src/bootstrap.tsx`, `src/rhoai/extensions.ts`, `src/app/hooks/useNamespaceSummary.ts`, `src/app/pages/UserInfoPage.tsx`
- **Icon**: `src/app/components/HelloWorldNavIcon.tsx` (renamed + component name + content updated)
- **Tests**: icon spec, extensions spec, namespace summary spec
- **Helm chart**: `chart/Chart.yaml`, `chart/values.yaml`, all templates including `serviceaccount.yaml`
- **CI/Build**: `.github/workflows/build-push.yml`, `scripts/build-push.sh`, `Makefile`, `scripts/scan-image.sh`
- **Docs**: `README.md`, `AGENTS.md`, `CONTRIBUTING.md`, `docs/development/BUILD_AND_PUSH.md`, and files under `docs/`
- **Cleanup**: deletes seed-only files, resets CHANGELOG, strips seed sections from docs
