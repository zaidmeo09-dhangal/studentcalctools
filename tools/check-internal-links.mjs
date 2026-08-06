import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(process.argv[2] || '_site');
const siteHosts = new Set(['studentcalctools.com', 'www.studentcalctools.com']);
const skippedSchemes = /^(?:mailto|tel|sms|javascript|data):/i;

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

function decodeEntities(value) {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function pageUrlForFile(file) {
  const relative = path.relative(root, file).split(path.sep).join('/');
  if (relative === 'index.html') return '/';
  if (relative.endsWith('/index.html')) return `/${relative.slice(0, -'index.html'.length)}`;
  return `/${relative}`;
}

function candidateFiles(pathname) {
  let clean = pathname;
  try { clean = decodeURIComponent(pathname); } catch {}
  clean = clean.replace(/\\/g, '/');
  const relative = clean.replace(/^\/+/, '');
  const candidates = new Set();

  if (!relative) candidates.add(path.join(root, 'index.html'));
  else {
    candidates.add(path.join(root, relative));
    if (clean.endsWith('/')) candidates.add(path.join(root, relative, 'index.html'));
    else {
      candidates.add(path.join(root, `${relative}.html`));
      candidates.add(path.join(root, relative, 'index.html'));
    }
  }
  return [...candidates];
}

async function firstExisting(candidates) {
  for (const candidate of candidates) {
    try {
      const stat = await fs.stat(candidate);
      if (stat.isFile()) return candidate;
    } catch {}
  }
  return null;
}

function collectAnchors(html) {
  const anchors = new Set();
  for (const match of html.matchAll(/\s(?:id|name)\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/gi)) {
    anchors.add(decodeEntities(match[1] || match[2] || match[3] || ''));
  }
  return anchors;
}

function extractHrefValues(html) {
  const values = [];
  const anchorPattern = /<a\b[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
  for (const match of html.matchAll(anchorPattern)) values.push(match[1] ?? match[2] ?? match[3] ?? '');
  return values;
}

function resolveInternalUrl(rawHref, currentPageUrl) {
  const href = decodeEntities(rawHref.trim());
  if (!href || skippedSchemes.test(href)) return null;

  try {
    const resolved = new URL(href, `https://studentcalctools.com${currentPageUrl}`);
    if (!siteHosts.has(resolved.hostname.toLowerCase())) return null;
    return { pathname: resolved.pathname, hash: resolved.hash ? decodeURIComponent(resolved.hash.slice(1)) : '' };
  } catch {
    return { invalid: true, original: href };
  }
}

let htmlFiles;
try {
  htmlFiles = (await walk(root)).filter((file) => file.endsWith('.html'));
} catch (error) {
  console.error(`Internal link check failed: cannot read ${root}: ${error.message}`);
  process.exit(1);
}

const htmlCache = new Map();
const failures = [];
let checked = 0;

for (const file of htmlFiles) {
  const html = await fs.readFile(file, 'utf8');
  const currentPageUrl = pageUrlForFile(file);

  for (const rawHref of extractHrefValues(html)) {
    const target = resolveInternalUrl(rawHref, currentPageUrl);
    if (!target) continue;
    checked += 1;

    if (target.invalid) {
      failures.push(`${currentPageUrl}: invalid href "${target.original}"`);
      continue;
    }

    const targetFile = await firstExisting(candidateFiles(target.pathname));
    if (!targetFile) {
      failures.push(`${currentPageUrl}: missing target ${rawHref}`);
      continue;
    }

    if (target.hash && targetFile.endsWith('.html')) {
      let targetHtml = htmlCache.get(targetFile);
      if (!targetHtml) {
        targetHtml = await fs.readFile(targetFile, 'utf8');
        htmlCache.set(targetFile, targetHtml);
      }
      if (!collectAnchors(targetHtml).has(target.hash)) {
        failures.push(`${currentPageUrl}: missing fragment #${target.hash} in ${target.pathname}`);
      }
    }
  }
}

if (failures.length) {
  console.error(`Internal link validation failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Internal link validation passed: ${checked} local link(s) checked across ${htmlFiles.length} HTML file(s).`);
