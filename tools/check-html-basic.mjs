import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

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

function countMatches(value, pattern) {
  return [...value.matchAll(pattern)].length;
}

function isRedirectPage(html) {
  return /<meta\b[^>]*http-equiv\s*=\s*["']?refresh/i.test(html) || /<title>\s*Redirecting/i.test(html);
}

let htmlFiles;
try {
  htmlFiles = (await walk(root)).filter((file) => file.endsWith('.html'));
} catch (error) {
  console.error(`HTML validation failed: cannot read ${root}: ${error.message}`);
  process.exit(1);
}

const failures = [];
let jsonLdChecked = 0;
let verificationFilesSkipped = 0;

for (const file of htmlFiles) {
  const html = await fs.readFile(file, 'utf8');
  const relative = path.relative(root, file).split(path.sep).join('/');
  if (/^\s*(?:google-site-verification|msvalidate\.01):/i.test(html)) {
    verificationFilesSkipped += 1;
    continue;
  }

  const redirect = isRedirectPage(html);
  const pageFailures = [];

  if (!/^\s*<!doctype\s+html>/i.test(html)) pageFailures.push('missing HTML doctype');
  if (!/<html\b[^>]*\blang\s*=/i.test(html)) pageFailures.push('missing lang attribute on html element');

  const titleCount = countMatches(html, /<title\b[^>]*>[\s\S]*?<\/title\s*>/gi);
  if (titleCount !== 1) pageFailures.push(`expected one title element, found ${titleCount}`);
  else if (/<title\b[^>]*>\s*<\/title\s*>/i.test(html)) pageFailures.push('title element is empty');

  if (!redirect) {
    if (countMatches(html, /<head\b[^>]*>/gi) !== 1 || countMatches(html, /<\/head\s*>/gi) !== 1) pageFailures.push('head element is missing or duplicated');
    if (countMatches(html, /<body\b[^>]*>/gi) !== 1 || countMatches(html, /<\/body\s*>/gi) !== 1) pageFailures.push('body element is missing or duplicated');
    if (!/<meta\b[^>]*charset\s*=/i.test(html)) pageFailures.push('missing meta charset');
  }

  const ids = new Map();
  for (const match of html.matchAll(/\sid\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/gi)) {
    const id = match[1] || match[2] || match[3];
    ids.set(id, (ids.get(id) || 0) + 1);
  }
  const duplicateIds = [...ids.entries()].filter(([, count]) => count > 1).map(([id]) => id);
  if (duplicateIds.length) pageFailures.push(`duplicate id value(s): ${duplicateIds.join(', ')}`);

  const canonicalCount = countMatches(html, /<link\b[^>]*\brel\s*=\s*(?:"[^"]*canonical[^"]*"|'[^']*canonical[^']*'|canonical)[^>]*>/gi);
  if (canonicalCount > 1) pageFailures.push(`multiple canonical links found (${canonicalCount})`);

  let scriptNumber = 0;
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    scriptNumber += 1;
    if (!/\btype\s*=\s*(?:"application\/ld\+json"|'application\/ld\+json'|application\/ld\+json)/i.test(match[1])) continue;
    jsonLdChecked += 1;
    try {
      JSON.parse(match[2].trim());
    } catch (error) {
      pageFailures.push(`invalid JSON-LD in script ${scriptNumber}: ${error.message}`);
    }
  }

  for (const issue of pageFailures) failures.push(`${relative}: ${issue}`);
}

if (failures.length) {
  console.error(`Basic HTML validation failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Basic HTML validation passed: ${htmlFiles.length - verificationFilesSkipped} page(s) and ${jsonLdChecked} JSON-LD block(s) checked; ${verificationFilesSkipped} verification file(s) skipped.`);
