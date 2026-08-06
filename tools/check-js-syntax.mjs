import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';

const root = path.resolve(process.argv[2] || '_site');

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(fullPath));
    else files.push(fullPath);
  }
  return files;
}

function attributes(tag) {
  const result = new Map();
  for (const match of tag.matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    result.set(match[1].toLowerCase(), match[2] ?? match[3] ?? match[4] ?? '');
  }
  return result;
}

function checkWithNode(file) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  return result.status === 0 ? null : (result.stderr || result.stdout || 'Unknown syntax error').trim();
}

let allFiles;
try {
  allFiles = await walk(root);
} catch (error) {
  console.error(`JavaScript syntax check failed: cannot read ${root}: ${error.message}`);
  process.exit(1);
}

const failures = [];
let externalChecked = 0;
let inlineChecked = 0;

for (const file of allFiles.filter((item) => /\.(?:js|mjs|cjs)$/i.test(item))) {
  externalChecked += 1;
  const error = checkWithNode(file);
  if (error) failures.push(`${path.relative(root, file)}: ${error}`);
}

for (const file of allFiles.filter((item) => item.endsWith('.html'))) {
  const html = await fs.readFile(file, 'utf8');
  let scriptIndex = 0;
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    scriptIndex += 1;
    const attrs = attributes(`<script ${match[1]}>`);
    if (attrs.has('src')) continue;

    const type = (attrs.get('type') || 'text/javascript').trim().toLowerCase();
    if (!['text/javascript', 'application/javascript', 'module'].includes(type)) continue;

    const source = match[2];
    if (!source.trim()) continue;
    inlineChecked += 1;
    const label = `${path.relative(root, file)} inline script ${scriptIndex}`;

    try {
      if (type === 'module') {
        const tempFile = path.join(os.tmpdir(), `studentcalctools-inline-${process.pid}-${inlineChecked}.mjs`);
        await fs.writeFile(tempFile, source, 'utf8');
        const error = checkWithNode(tempFile);
        await fs.rm(tempFile, { force: true });
        if (error) failures.push(`${label}: ${error}`);
      } else {
        new vm.Script(source, { filename: label });
      }
    } catch (error) {
      failures.push(`${label}: ${error.message}`);
    }
  }
}

if (failures.length) {
  console.error(`JavaScript syntax validation failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`JavaScript syntax validation passed: ${externalChecked} external file(s) and ${inlineChecked} inline script(s) checked.`);
