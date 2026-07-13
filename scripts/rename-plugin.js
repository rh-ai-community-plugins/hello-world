#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ROOT = path.resolve(__dirname, '..');

// --- Name conversion helpers ---

function toKebab(displayName) {
  return displayName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function toCamel(kebab) {
  return kebab.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
}

function toPascal(kebab) {
  const camel = toCamel(kebab);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

function toSnake(kebab) {
  return kebab.replace(/-/g, '_');
}

function toTitle(kebab) {
  return kebab
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function toInitials(displayName) {
  const words = displayName.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
}

const ICON_COLORS = [
  '#0066cc', // blue
  '#3e8635', // green
  '#c9190b', // red
  '#6b21a8', // purple (original)
  '#ec7a08', // orange
  '#009596', // teal
  '#7d1007', // dark red
  '#1f0066', // indigo
];

function pickIconColor(kebab) {
  let hash = 0;
  for (let i = 0; i < kebab.length; i++) {
    hash = (hash * 31 + kebab.charCodeAt(i)) | 0;
  }
  return ICON_COLORS[Math.abs(hash) % ICON_COLORS.length];
}

// --- CLI argument parsing ---

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry-run') {
      args.dryRun = true;
    } else if (arg === '--yes' || arg === '-y') {
      args.yes = true;
    } else if (arg.startsWith('--') && i + 1 < argv.length) {
      const key = arg.slice(2);
      args[key] = argv[++i];
    }
  }
  return args;
}

// --- Interactive prompting ---

function createPrompt() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stderr,
    terminal: process.stdin.isTTY !== false,
  });
  return {
    ask(question, defaultValue) {
      const suffix = defaultValue ? ` [${defaultValue}]` : '';
      return new Promise((resolve) => {
        rl.question(`${question}${suffix}: `, (answer) => {
          resolve(answer.trim() || defaultValue || '');
        });
      });
    },
    confirm(question) {
      return new Promise((resolve) => {
        rl.question(`${question} (y/N): `, (answer) => {
          resolve(answer.trim().toLowerCase() === 'y');
        });
      });
    },
    close() {
      rl.close();
    },
  };
}

// --- File operations ---

function replaceInFile(filePath, replacements, dryRun) {
  const absPath = path.resolve(ROOT, filePath);
  if (!fs.existsSync(absPath)) {
    return null;
  }
  const original = fs.readFileSync(absPath, 'utf8');
  let content = original;
  for (const [from, to] of replacements) {
    content = content.split(from).join(to);
  }
  if (content === original) {
    return null;
  }
  if (!dryRun) {
    fs.writeFileSync(absPath, content);
  }
  return filePath;
}

function renameFile(fromPath, toPath, dryRun) {
  const absFrom = path.resolve(ROOT, fromPath);
  const absTo = path.resolve(ROOT, toPath);
  if (!fs.existsSync(absFrom)) {
    return null;
  }
  if (!dryRun) {
    fs.renameSync(absFrom, absTo);
  }
  return { from: fromPath, to: toPath };
}

// --- Build the full change plan ---

function buildChangePlan(names) {
  const { kebab, camel, pascal, snake, display, port, initials, iconColor } = names;

  // Base replacements for identifiers (no package/chart-name patterns).
  // Order matters: longer/more-specific patterns first to avoid partial matches.
  const identifierReplacements = [
    ['HelloWorld', pascal],
    ['helloWorld', camel],
    ['hello-world', kebab],
    ['hello_world', snake],
    ['Hello World', display],
  ];

  // package.json: match the JSON name field specifically so route paths get the plain kebab
  const npmReplacements = [
    ['"name": "hello-world"', `"name": "rhoai-${kebab}"`],
    ...identifierReplacements,
  ];

  // BFF package.json uses "hello-world-bff" as name
  const bffNpmReplacements = [
    ['hello-world-bff', `${kebab}-bff`],
    ...identifierReplacements,
  ];

  const imageReplacements = [
    ['quay.io/rh-ai-community-plugins/hello-world-bff', `quay.io/OWNER/${kebab}-bff`],
    ['quay.io/rh-ai-community-plugins/hello-world', `quay.io/OWNER/rhoai-${kebab}`],
    ['rhoai-hello-world', `rhoai-${kebab}`],
    ['hello-world-bff', `${kebab}-bff`],
    ['hello-world', `rhoai-${kebab}`],
  ];

  const portReplacements =
    port !== '9500' ? [['9500', port]] : [];

  // Icon-specific replacements (initials + color)
  const iconReplacements = [
    ['      HW\n', `      ${initials}\n`],
    ["'HW'", `'${initials}'`],
    ['#6b21a8', iconColor],
  ];

  // Files grouped by category with their replacement sets
  const sourceFiles = [
    'config/webpack.common.js',
    'config/moduleFederation.js',
    'config/webpack.dev.js',
    '.env.development',
    'src/bootstrap.tsx',
    'src/rhoai/extensions.ts',
    'src/app/hooks/useNamespaceSummary.ts',
  ];

  const iconFiles = [
    'src/app/components/HelloWorldNavIcon.tsx',
    'src/app/components/__tests__/HelloWorldNavIcon.spec.tsx',
  ];

  const testFiles = [
    'src/rhoai/__tests__/extensions.spec.ts',
    'src/app/hooks/__tests__/useNamespaceSummary.spec.ts',
  ];

  const chartFiles = [
    'chart/Chart.yaml',
    'chart/values.yaml',
    'chart/templates/_helpers.tpl',
    'chart/templates/deployment.yaml',
    'chart/templates/service.yaml',
    'chart/templates/bff-deployment.yaml',
    'chart/templates/bff-service.yaml',
  ];

  const ciFiles = [
    '.github/workflows/build-push.yml',
    'scripts/build-push.sh',
  ];

  const docFiles = [
    'README.md',
    'CLAUDE.md',
    'docs/architecture/BFF_PATTERN.md',
    'docs/development/CUSTOMIZATION.md',
    'docs/development/LOCAL_SETUP.md',
    'docs/development/DASHBOARD_APIS.md',
    'docs/development/PROJECT_LAYOUT.md',
    'docs/deployment/OPENSHIFT_DEPLOY.md',
    'docs/archives/PROJECT_PLAN.md',
    'docs/archives/BUILD_PLAN.md',
  ];

  const fileReplacements = [];

  // package.json: name field "hello-world" → "rhoai-{kebab}"
  fileReplacements.push({
    file: 'package.json',
    replacements: [...npmReplacements, ...portReplacements],
  });

  // bff/package.json: "hello-world-bff" → "{kebab}-bff"
  fileReplacements.push({
    file: 'bff/package.json',
    replacements: [...bffNpmReplacements],
  });

  // plugin.yaml: image URL replacement (specific, not catch-all) + identifiers
  fileReplacements.push({
    file: 'plugin.yaml',
    replacements: [
      ['quay.io/rh-ai-community-plugins/hello-world', `quay.io/OWNER/rhoai-${kebab}`],
      ...identifierReplacements,
    ],
  });

  // Source + test files: identifier replacements + port
  for (const f of [...sourceFiles, ...testFiles]) {
    fileReplacements.push({
      file: f,
      replacements: [...identifierReplacements, ...portReplacements],
    });
  }

  // Icon files: identifier replacements + icon-specific (initials, color)
  for (const f of iconFiles) {
    fileReplacements.push({
      file: f,
      replacements: [...identifierReplacements, ...iconReplacements],
    });
  }

  // Chart files: image replacements + identifiers
  for (const f of chartFiles) {
    fileReplacements.push({
      file: f,
      replacements: [...imageReplacements, ...identifierReplacements],
    });
  }

  // CI files: image replacements first, then identifiers
  for (const f of ciFiles) {
    fileReplacements.push({
      file: f,
      replacements: [...imageReplacements, ...identifierReplacements],
    });
  }

  // Doc files: all replacements (images + npm name + identifiers)
  for (const f of docFiles) {
    fileReplacements.push({
      file: f,
      replacements: [...imageReplacements, ...npmReplacements, ...identifierReplacements],
    });
  }

  // File renames (after content replacements)
  const fileRenames = [
    {
      from: `src/app/components/HelloWorldNavIcon.tsx`,
      to: `src/app/components/${pascal}NavIcon.tsx`,
    },
    {
      from: `src/app/components/__tests__/HelloWorldNavIcon.spec.tsx`,
      to: `src/app/components/__tests__/${pascal}NavIcon.spec.tsx`,
    },
  ];

  return { fileReplacements, fileRenames };
}

// --- Execute the plan ---

function executePlan(plan, dryRun) {
  const modified = [];
  const renamed = [];

  for (const { file, replacements } of plan.fileReplacements) {
    const result = replaceInFile(file, replacements, dryRun);
    if (result) {
      modified.push(result);
    }
  }

  for (const { from, to } of plan.fileRenames) {
    if (from === to) continue;
    const result = renameFile(from, to, dryRun);
    if (result) {
      renamed.push(result);
    }
  }

  return { modified, renamed };
}

// --- Display helpers ---

function printSummary(names, plan, prefix = '') {
  console.log(`${prefix}Plugin identifiers:`);
  console.log(`${prefix}  Display name : ${names.display}`);
  console.log(`${prefix}  kebab-case   : ${names.kebab}`);
  console.log(`${prefix}  camelCase    : ${names.camel}`);
  console.log(`${prefix}  PascalCase   : ${names.pascal}`);
  console.log(`${prefix}  snake_case   : ${names.snake}`);
  console.log(`${prefix}  Icon initials: ${names.initials}`);
  console.log(`${prefix}  Icon color   : ${names.iconColor}`);
  console.log(`${prefix}  Dev port     : ${names.port}`);
  console.log('');

  const allFiles = plan.fileReplacements.map((r) => r.file);
  console.log(`${prefix}Files to modify (${allFiles.length}):`);
  for (const f of allFiles) {
    const exists = fs.existsSync(path.resolve(ROOT, f));
    console.log(`${prefix}  ${exists ? '  ' : '? '}${f}`);
  }

  if (plan.fileRenames.some((r) => r.from !== r.to)) {
    console.log('');
    console.log(`${prefix}Files to rename:`);
    for (const { from, to } of plan.fileRenames) {
      if (from !== to) {
        console.log(`${prefix}  ${from}`);
        console.log(`${prefix}    → ${to}`);
      }
    }
  }
}

function printResults(results, dryRun) {
  const label = dryRun ? 'Would modify' : 'Modified';
  if (results.modified.length) {
    console.log(`\n${label} ${results.modified.length} file(s):`);
    for (const f of results.modified) {
      console.log(`  ${f}`);
    }
  }

  const renameLabel = dryRun ? 'Would rename' : 'Renamed';
  if (results.renamed.length) {
    console.log(`\n${renameLabel} ${results.renamed.length} file(s):`);
    for (const { from, to } of results.renamed) {
      console.log(`  ${from} → ${to}`);
    }
  }

  if (!results.modified.length && !results.renamed.length) {
    console.log('\nNo changes needed.');
  }
}

function printNextSteps(names, dryRun) {
  const verb = dryRun ? 'will need to' : 'need to';
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║  IMPORTANT — Manual steps required before running the plugin    ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`  You ${verb} update the dashboard configuration to match the`);
  console.log('  new plugin identifiers. The plugin will NOT load without this.');
  console.log('');
  console.log('  1. Update MODULE_FEDERATION_CONFIG (env var or .env.local):');
  console.log('');
  console.log(`     "name": "${names.camel}",`);
  console.log('     ...');
  console.log('     "proxyService": [{');
  console.log(`       "path": "/${names.kebab}/api",`);
  console.log('       ...');
  console.log('     }]');
  console.log('');
  console.log('  2. Restart ALL services (dashboard, plugin dev server, BFF).');
  console.log('     A running dashboard caches the old federation config;');
  console.log('     it must be fully restarted to pick up the new names.');
  console.log('');
  console.log('  3. Update container image repositories:');
  console.log('     - Replace quay.io/OWNER/ placeholders with your registry org');
  console.log('       in chart/values.yaml and .github/workflows/build-push.yml');
  console.log('');
  console.log('  4. Update plugin.yaml remoteEntry URL to your deployed image URL.');
}

// --- Main ---

async function main() {
  const args = parseArgs(process.argv);
  const isInteractive = !args.name;

  let names;

  if (isInteractive) {
    const prompt = createPrompt();
    try {
      console.log('Rename plugin — generate new identifiers from a display name.\n');

      const displayName = await prompt.ask('Plugin display name (e.g. "My Cool Plugin")');
      if (!displayName) {
        console.error('Error: display name is required.');
        process.exit(1);
      }

      const defaultKebab = toKebab(displayName);
      const kebab = await prompt.ask('  kebab-case', defaultKebab);
      const camel = await prompt.ask('  camelCase', toCamel(kebab));
      const pascal = await prompt.ask('  PascalCase', toPascal(kebab));
      const snake = await prompt.ask('  snake_case', toSnake(kebab));
      const display = await prompt.ask('  Display name', toTitle(kebab));
      const initials = await prompt.ask('  Icon initials', toInitials(display));
      const iconColor = await prompt.ask('  Icon color', pickIconColor(kebab));
      const port = await prompt.ask('  Dev port', '9500');

      names = { kebab, camel, pascal, snake, display, initials, iconColor, port };
      const plan = buildChangePlan(names);

      console.log('');
      printSummary(names, plan);
      console.log('');

      const confirmed = await prompt.confirm('Apply these changes?');
      if (!confirmed) {
        console.log('Aborted.');
        process.exit(0);
      }

      const results = executePlan(plan, false);
      printResults(results, false);
      printNextSteps(names, false);
      console.log('\nRun `npm run validate` to verify the changes.');
    } finally {
      prompt.close();
    }
  } else {
    // Non-interactive mode
    const displayName = args.name;
    const kebab = args.kebab || toKebab(displayName);
    const camel = args.camel || toCamel(kebab);
    const pascal = args.pascal || toPascal(kebab);
    const snake = args.snake || toSnake(kebab);
    const display = args.display || toTitle(kebab);
    const initials = args.initials || toInitials(display);
    const iconColor = args['icon-color'] || pickIconColor(kebab);
    const port = args.port || '9500';

    names = { kebab, camel, pascal, snake, display, initials, iconColor, port };
    const plan = buildChangePlan(names);
    const dryRun = !!args.dryRun;

    if (!args.yes && !dryRun) {
      const prompt = createPrompt();
      try {
        printSummary(names, plan);
        console.log('');
        const confirmed = await prompt.confirm('Apply these changes?');
        if (!confirmed) {
          console.log('Aborted.');
          process.exit(0);
        }
      } finally {
        prompt.close();
      }
    } else if (dryRun) {
      printSummary(names, plan);
    }

    const results = executePlan(plan, dryRun);
    printResults(results, dryRun);

    printNextSteps(names, dryRun);

    if (!dryRun) {
      console.log('\nRun `npm run validate` to verify the changes.');
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
