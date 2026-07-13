# Customizing This Plugin

When forking this repository to create your own community plugin, you need to replace all plugin-specific identifiers with values unique to your plugin.

## Automated Rename (Recommended)

The `rename-plugin` script handles the entire renaming process — it derives all naming variants from a display name, replaces identifiers across ~33 files, renames icon component files, and updates icon initials and color.

### Interactive mode

```bash
npm run rename-plugin
```

The script prompts for a display name, shows previews of all derived variants, lists files to modify, and asks for confirmation before applying.

### Non-interactive mode

```bash
npm run rename-plugin -- --name "My Cool Plugin" --yes
```

Available flags:

| Flag            | Purpose                                   |
|----------------|-------------------------------------------|
| `--name`       | Display name (required in non-interactive) |
| `--kebab`      | Override kebab-case                        |
| `--camel`      | Override camelCase                         |
| `--pascal`     | Override PascalCase                        |
| `--snake`      | Override snake_case                        |
| `--display`    | Override display name                      |
| `--port`       | Override dev server port (default: 9500)   |
| `--initials`   | Override icon initials                     |
| `--icon-color` | Override icon color (hex, e.g. `#0066cc`)  |
| `--dry-run`    | Preview changes without applying           |
| `--yes` / `-y` | Skip confirmation prompt                   |

### Claude Code skill

If you use [Claude Code](https://docs.anthropic.com/en/docs/claude-code), the `/rename-plugin` skill wraps this script. Ask Claude to "rename this plugin" or "create a new plugin called X" and it will run the script, verify the result, and relay the post-rename steps.

### Post-rename steps

The script prints these after running — they require manual action:

1. **Update `MODULE_FEDERATION_CONFIG`** in the dashboard's environment — the `name` field must match the new camelCase identifier, and `proxyService.path` must match `/{kebab}/api`.
2. **Restart ALL services** — the dashboard, plugin dev server, and BFF must all be restarted. The dashboard caches federation config at startup.
3. **Update container image repositories** — replace `quay.io/OWNER/` placeholders in `chart/values.yaml` and `.github/workflows/build-push.yml`.
4. **Update `plugin.yaml`** — set the `remoteEntry` URL to point to your deployed image location.

### Verify

```bash
npm run lint && npm test
```

Both must pass with zero errors before proceeding.

---

## Manual Reference

If you prefer to rename files manually, or need to understand what the script changes, the sections below list every identifier and file involved. Files containing these identifiers are annotated with `[PLUGIN-SPECIFIC]` and `[SHARED]` comments throughout the codebase.

- **`[PLUGIN-SPECIFIC]`** — Must be unique per plugin. Change when forking.
- **`[SHARED]`** — Common convention across all community plugins. Do not change.

### Naming Conventions

- **Route prefix, IDs, section IDs**: kebab-case (`my-plugin`)
- **Module Federation name/scope**: camelCase (`myPlugin`)
- **Nav item IDs**: prefix with your plugin name (`my-plugin-page-name`)
- **Section group sort key**: `{number}_{snake_case}` (e.g. `1_my_plugin`)
- **npm package name**: `rhoai-{your-plugin}`

All route prefixes, hrefs, and path patterns in `extensions.ts` must use the same prefix as the route extension's `path` (e.g. `/my-plugin/*`).

### Identifiers to change

| File | Identifier | Current value | Replace with |
|---|---|---|---|
| `package.json` | `name` | `rhoai-hello-world` | `rhoai-{your-plugin}` |
| `package.json` | `module-federation.name` | `helloWorld` | `{yourPlugin}` (camelCase) |
| `package.json` | `module-federation.proxy[].path` | `/hello-world` | `/{your-plugin}` |
| `package.json` | `module-federation.proxy[].pathRewrite` | `/hello-world` | `/{your-plugin}` |
| `package.json` | `module-federation.local.port` | `9500` | Any unused port (see [Port allocation](#port-allocation)) |
| `plugin.yaml` | `metadata.name` | `hello-world` | `{your-plugin}` |
| `plugin.yaml` | `metadata.displayName` | `Hello World` | Your plugin name |
| `plugin.yaml` | `remote.spec.name` | `helloWorld` | `{yourPlugin}` (camelCase) |
| `plugin.yaml` | `remote.spec.scope` | `helloWorld` | `{yourPlugin}` (must match `name`) |
| `plugin.yaml` | `remote.spec.remoteEntry` | `.../rhoai-hello-world/...` | Your deployed image URL |
| `plugin.yaml` | `paths[0].path` | `/hello-world` | `/{your-plugin}` |
| `plugin.yaml` | `paths[0].extensions` | `helloWorld/extensions` | `{yourPlugin}/extensions` |
| `plugin.yaml` | `paths[1].path` | `helloWorld/Icon` | `{yourPlugin}/Icon` |
| `src/rhoai/extensions.ts` | area `id` | `hello-world` | `{your-plugin}` |
| `src/rhoai/extensions.ts` | plugin section `id` | `hello-world` | `{your-plugin}` |
| `src/rhoai/extensions.ts` | plugin section `title` | `Hello World` | Your plugin name |
| `src/rhoai/extensions.ts` | plugin section `group` | `1_hello_world` | `{N}_{your_plugin}` |
| `src/rhoai/extensions.ts` | nav item `id`s | `hello-world-*` | `{your-plugin}-{page}` |
| `src/rhoai/extensions.ts` | nav item `href`/`path` | `/hello-world/*` | `/{your-plugin}/*` |
| `src/rhoai/extensions.ts` | route `path` | `/hello-world/*` | `/{your-plugin}/*` |
| `src/bootstrap.tsx` | `Router basename` | `/hello-world` | `/{your-plugin}` |
| `config/webpack.common.js` | MF plugin `name` | `helloWorld` | `{yourPlugin}` (camelCase) |
| `config/moduleFederation.js` | `name` | `helloWorld` | `{yourPlugin}` (camelCase) |
| `config/webpack.dev.js` | proxy `context` | `/hello-world` | `/{your-plugin}` |
| `config/webpack.dev.js` | `port` | `9500` | Same as `package.json` port |
| `.env.development` | `URL_PREFIX` | `/hello-world` | `/{your-plugin}` |
| `chart/Chart.yaml` | `name` | `hello-world-plugin` | `{your-plugin}-plugin` |
| `chart/values.yaml` | `image.repository` | `.../rhoai-hello-world` | Your image repository |
| `chart/values.yaml` | `ingress.path` | `/hello-world` | `/{your-plugin}` |

### Identifiers to keep (shared)

These are shared conventions that all community plugins should use identically:

| File | Identifier | Value | Purpose |
|---|---|---|---|
| `src/rhoai/extensions.ts` | community section `id` | `community-plugins` | Groups all community plugins in one sidebar section |
| `src/rhoai/extensions.ts` | community section `title` | `Community plugins` | Display name for the shared section |
| `src/rhoai/extensions.ts` | community section `group` | `9_plugins` | Sort position in the dashboard sidebar |
| `src/rhoai/extensions.ts` | plugin section `section` ref | `community-plugins` | Nests your plugin under the shared section |
| `config/webpack.common.js` | MF `filename` | `remoteEntry.js` | Standard Module Federation entry filename |
| `config/webpack.common.js` | expose keys | `./extensions`, `./Icon` | Standard module names expected by the host |

### Port Allocation

The dev server port only matters if you run multiple plugin dev servers simultaneously — each needs a unique port. Otherwise, any free port works. This project defaults to **9500**. The official RHOAI plugins in the dashboard monorepo occupy ports 9100–9111; community plugins use a different range to avoid any potential collision.
