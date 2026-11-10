#!/usr/bin/env node
/**
 * Seeds the Arcline demo content into Strapi: 3 authors, 7 blog posts, 7 case studies, 6 services.
 *
 *  - Media files (seed/media) are uploaded with the Upload REST API, because the Strapi MCP server
 *    can reference existing assets but cannot upload new ones.
 *  - Entries are created, updated and published through the Strapi MCP server (/mcp), using the
 *    per-content-type tools it generates (list_*, create_*, update_*, publish_*).
 *    https://docs.strapi.io/cms/features/strapi-mcp-server
 *  - Blog posts are linked to their author (relation) by the author's documentId.
 *
 * Idempotent: media is matched by file name and entries by slug (authors by name), so re-running updates in place.
 *
 * Usage (from the strapi/ folder, with Strapi running):
 *   STRAPI_URL=http://localhost:1337 \
 *   STRAPI_UPLOAD_TOKEN=<full-access API token> \
 *   STRAPI_MCP_TOKEN=<admin token with Content Manager permissions> \
 *   node scripts/seed.mjs [--dry-run]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SEED_DIR = path.join(ROOT, 'seed');
const STRAPI_URL = (process.env.STRAPI_URL || 'http://localhost:1337').replace(/\/$/, '');
const UPLOAD_TOKEN = process.env.STRAPI_UPLOAD_TOKEN;
const MCP_TOKEN = process.env.STRAPI_MCP_TOKEN;
const DRY_RUN = process.argv.includes('--dry-run');

if (!DRY_RUN && (!UPLOAD_TOKEN || !MCP_TOKEN)) {
  console.error('Set STRAPI_UPLOAD_TOKEN (full-access API token) and STRAPI_MCP_TOKEN (admin token). See README → CMS setup.');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(path.join(SEED_DIR, 'data.json'), 'utf8'));

// ---------------------------------------------------------------- MCP client (Streamable HTTP, stateless)
let rpcId = 0;
async function mcp(method, params = {}) {
  const res = await fetch(`${STRAPI_URL}/mcp`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${MCP_TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: ++rpcId, method, params }),
  });
  if (!res.ok) throw new Error(`MCP ${method} → HTTP ${res.status}: ${await res.text()}`);
  const text = await res.text();
  // Responses arrive as server-sent events ("data: {...}") or plain JSON.
  const payload = text.includes('data:')
    ? text.split('\n').filter((l) => l.startsWith('data:')).map((l) => JSON.parse(l.slice(5))).find((m) => m.id === rpcId)
    : JSON.parse(text);
  if (payload?.error) throw new Error(`MCP ${method}: ${payload.error.message}`);
  return payload.result;
}

async function tool(name, args) {
  const result = await mcp('tools/call', { name, arguments: args });
  if (result.isError) throw new Error(`${name}: ${result.content?.map((c) => c.text).join(' ')}`);
  if (result.structuredContent) return result.structuredContent;
  const text = result.content?.find((c) => c.type === 'text')?.text;
  try { return JSON.parse(text); } catch { return text; }
}

/** Tool names are derived from the content type (e.g. list_blog_post / list_blog-post): find them once. */
let toolNames = [];
function toolFor(action, type) {
  const candidates = [`${action}_${type}`, `${action}_${type.replace(/-/g, '_')}`, `${action}_${type}_${type}`, `${action}_${type.replace(/-/g, '_')}_${type.replace(/-/g, '_')}`];
  const found = candidates.find((c) => toolNames.includes(c));
  if (!found) throw new Error(`No MCP tool for ${action} ${type}. Available: ${toolNames.join(', ')}`);
  return found;
}

// ---------------------------------------------------------------- Media (Upload REST API)
const uploaded = new Map(); // file name → { id, url }

async function findUpload(name) {
  const url = new URL('/api/upload/files', STRAPI_URL);
  url.searchParams.set('filters[name][$eq]', name);
  const res = await fetch(url, { headers: { Authorization: `Bearer ${UPLOAD_TOKEN}` } });
  if (!res.ok) throw new Error(`Upload lookup failed (${res.status}): ${await res.text()}`);
  const files = await res.json();
  return files[0];
}

async function upload(file, alt) {
  if (uploaded.has(file)) return uploaded.get(file);
  if (DRY_RUN) { const fake = { id: 0, url: `/uploads/${file}` }; uploaded.set(file, fake); return fake; }
  let asset = await findUpload(file);
  if (!asset) {
    const form = new FormData();
    const buffer = fs.readFileSync(path.join(SEED_DIR, 'media', file));
    const type = file.endsWith('.png') ? 'image/png' : /\.jpe?g$/.test(file) ? 'image/jpeg' : 'image/webp';
    form.append('files', new Blob([buffer], { type }), file);
    form.append('fileInfo', JSON.stringify({ name: file, alternativeText: alt || '' }));
    const res = await fetch(`${STRAPI_URL}/api/upload`, { method: 'POST', headers: { Authorization: `Bearer ${UPLOAD_TOKEN}` }, body: form });
    if (!res.ok) throw new Error(`Upload of ${file} failed (${res.status}): ${await res.text()}`);
    [asset] = await res.json();
    console.log(`  ↑ uploaded ${file}`);
  }
  const ref = { id: asset.id, url: asset.url };
  uploaded.set(file, ref);
  return ref;
}

/** Replace { file, alt } media refs with uploaded asset ids; drop empty values. */
async function resolveMedia(value) {
  if (Array.isArray(value)) return Promise.all(value.map(resolveMedia));
  if (value && typeof value === 'object') {
    if (typeof value.file === 'string' && Object.keys(value).every((k) => k === 'file' || k === 'alt')) {
      return (await upload(value.file, value.alt)).id;
    }
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (v === null || v === undefined || v === '') continue;
      out[k] = await resolveMedia(v);
    }
    return out;
  }
  return value;
}

// ---------------------------------------------------------------- Entries (MCP)
/**
 * Upserts entries of one collection. `key` identifies existing entries (slug, or name for authors).
 * `prepare` can adjust the payload (e.g. replace the author name by its documentId).
 */
async function seedCollection(type, entries, { key = 'slug', publish = true, prepare = (p) => p } = {}) {
  console.log(`\n${type}: ${entries.length} entries`);
  const ids = new Map();
  const existing = DRY_RUN ? [] : (await tool(toolFor('list', type), { pageSize: 100 }))?.results ?? [];
  const byKey = new Map((existing || []).map((e) => [e[key], e.documentId]));
  for (const entry of entries) {
    const payload = prepare(await resolveMedia(entry));
    if (DRY_RUN) { console.log(`  · would upsert ${entry[key]}`); continue; }
    let documentId = byKey.get(entry[key]);
    if (documentId) {
      await tool(toolFor('update', type), { documentId, data: payload });
      console.log(`  ✎ updated ${entry[key]}`);
    } else {
      const created = await tool(toolFor('create', type), { data: payload });
      documentId = created?.documentId ?? created?.data?.documentId ?? created?.result?.documentId;
      if (!documentId) throw new Error(`create ${type} returned no documentId: ${JSON.stringify(created).slice(0, 300)}`);
      console.log(`  + created ${entry[key]}`);
    }
    if (publish) await tool(toolFor('publish', type), { documentId });
    ids.set(entry[key], documentId);
  }
  return ids;
}

if (!DRY_RUN) {
  const init = await mcp('initialize', {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: { name: 'arcline-seed', version: '1.0.0' },
  });
  console.log(`Connected to ${init.serverInfo?.name} at ${STRAPI_URL}/mcp`);
  toolNames = ((await mcp('tools/list')).tools || []).map((t) => t.name);
}

// Authors have no draft/publish step; blog posts reference them by documentId.
const authorIds = await seedCollection('author', data.authors, { key: 'name', publish: false });
await seedCollection('blog-post', data.blogPosts, {
  prepare: (p) => ({ ...p, author: authorIds.get(p.author) ?? null }),
});
await seedCollection('case-study', data.caseStudies);
await seedCollection('service', data.services);

// ---------------------------------------------------------------- Verify counts (REST API)
if (!DRY_RUN) {
  console.log('\nVerification (published entries via REST):');
  const checks = [['authors', data.authors.length], ['blog-posts', data.blogPosts.length], ['case-studies', data.caseStudies.length], ['services', data.services.length]];
  let ok = true;
  for (const [plural, expected] of checks) {
    const res = await fetch(`${STRAPI_URL}/api/${plural}?pagination[pageSize]=1`, { headers: { Authorization: `Bearer ${UPLOAD_TOKEN}` } });
    const total = (await res.json())?.meta?.pagination?.total;
    ok &&= total === expected;
    console.log(`  ${plural}: ${total}/${expected} ${total === expected ? '✓' : '✗'}`);
  }
  const res = await fetch(`${STRAPI_URL}/api/blog-posts?populate[author]=true&pagination[pageSize]=100`, { headers: { Authorization: `Bearer ${UPLOAD_TOKEN}` } });
  const linked = ((await res.json())?.data || []).filter((p) => p.author?.name).length;
  console.log(`  blog posts with an author: ${linked}/${data.blogPosts.length} ${linked === data.blogPosts.length ? '✓' : '✗'}`);
  if (!ok || linked !== data.blogPosts.length) process.exitCode = 1;
}
console.log('\nDone.');
