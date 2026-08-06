import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(process.argv[2] || '_site');
const siteHosts = new Set(['studentcalctools.com', 'www.studentcalctools.com']);
const skippedSchemes = /^(?:data|blob|mailto|tel|sms|javascript):/i;

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
  return value.replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'");
}

function pageUrlForFile(file) {
  const relative = path.relative(root, file).split(path.sep).join('/');
  if (relative === 'index.html') return '/';
  if (relative.endsWith('/index.html')) return `/${relative.slice(0, -'index.html'.length)}`;
  return `/${relative}`;
}

function parseAttributes(tag) {
  const attributes = new Map();
  for (const match of tag.matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    attributes.set(match[1].toLowerCase(), match[2] ?? match[3] ?? match[4] ?? '');
  }
  return attributes;
}

function addSrcset(value, list) {
  for (const item of value.split(',')) {
    const candidate = item.trim().split(/\s+/)[0];
    if (candidate) list.push(candidate);
  }
}

function extractAssetUrls(html) {
  const urls = [];
  for (const match of html.matchAll(/<(img|script|source|video|audio|track|iframe|embed|object|link|meta)\b[^>]*>/gi)) {
    const tagName = match[1].toLowerCase();
    const attrs = parseAttributes(match[0]);

    if (['img', 'script', 'source', 'video', 'audio', 'track', 'iframe', 'embed'].includes(tagName) && attrs.get('src')) {
      urls.push(attrs.get('src'));
    }
    if (tagName === 'object' && attrs.get('data')) urls.push(attrs.get('data'));
    if (tagName === 'video' && attrs.get('poster')) urls.push(attrs.get('poster'));
    if (attrs.get('srcset')) addSrcset(attrs.get('srcset'), urls);

    if (tagName === 'link') {
      const rel = (attrs.get('rel') || '').toLowerCase().split(/\s+/);
      const assetRels = new Set(['stylesheet', 'icon', 'manifest', 'preload', 'modulepreload', 'apple-touch-icon']);
      if (attrs.get('href') && rel.some((value) => assetRels.has(value))) urls.push(attrs.get('href'));
    }

    if (tagName === 'meta') {
      const property = (attrs.get('property') || attrs.get('name') || '').toLowerCase();
      if (['og:image', 'og:image:secure_url', 'twitter:image'].includes(property) && attrs.get('content')) {
        urls.push(attrs.get('content'));
      }
    }
  }

  for (const match of html.matchAll(/url\(\s*(?:"([^"]+)"|'([^']+)'|([^)'"\s]+))\s*\)/gi)) {
    urls.push(match[1] ?? match[2] ?? match[3] ?? '');
  }

  return urls;
}

function resolveAsset(raw, currentPageUrl) {
  const value = decodeEntities(raw.trim());
  if (!value || value.startsWith('#') || skippedSchemes.test(value)) return null;

  try {
    const resolved = new URL(value, `https://studentcalctools.com${currentPageUrl}`);
    if (!siteHosts.has(resolved.hostname.toLowerCase())) return null;
    let pathname = decodeURIComponent(resolved.pathname).replace(/\\/g, '/');
    if (pathname.endsWith('/')) return null;
    return pathname;
  } catch {
    return { invalid: true, original: value };
  }
}

function assetFile(pathname) {
  return path.join(root, pathname.replace(/^\/+/, ''));
}

let allFiles;
try {
  allFiles = await walk(root);
} catch (error) {
  console.error(`Local asset check failed: cannot read ${root}: ${error.message}`);
  process.exit(1);
}

const contentFiles = allFiles.filter((file) => file.endsWith('.html') || file.endsWith('.css'));
const failures = [];
let checked = 0;

for (const file of contentFiles) {
  const contents = await fs.readFile(file, 'utf8');
  const currentPageUrl = pageUrlForFile(file);
  const urls = file.endsWith('.html') ? extractAssetUrls(contents) : [...contents.matchAll(/url\(\s*(?:"([^"]+)"|'([^']+)'|([^)'"\s]+))\s*\)/gi)].map((match) => match[1] ?? match[2] ?? match[3] ?? '');

  for (const rawUrl of urls) {
    const target = resolveAsset(rawUrl, currentPageUrl);
    if (!target) continue;
    checked += 1;

    if (target.invalid) {
      failures.push(`${currentPageUrl}: invalid asset URL "${target.original}"`);
      continue;
    }

    try {
      const stat = await fs.stat(assetFile(target));
      if (!stat.isFile()) failures.push(`${currentPageUrl}: asset is not a file ${rawUrl}`);
    } catch {
      failures.push(`${currentPageUrl}: missing local asset ${rawUrl}`);
    }
  }
}

if (failures.length) {
  console.error(`Local asset validation failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Local asset validation passed: ${checked} local asset reference(s) checked across ${contentFiles.length} file(s).`);
