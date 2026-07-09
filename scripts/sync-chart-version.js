const { version } = require('../package.json');
const fs = require('fs');

const chartPath = 'chart/Chart.yaml';
let chart = fs.readFileSync(chartPath, 'utf8');
chart = chart.replace(/^version:.*/m, `version: ${version}`);
chart = chart.replace(/^appVersion:.*/m, `appVersion: "${version}"`);
fs.writeFileSync(chartPath, chart);
