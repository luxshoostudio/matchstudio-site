#!/usr/bin/env node

import { mkdir, readFile, rm, rename, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_FILE = path.join(ROOT, 'data', 'cases.json');
const ASSETS_DIR = path.join(ROOT, 'assets', 'cases');
const TEMP_DIR = path.join(ROOT, '.airtable-sync-tmp');

const CONFIG = {
  token: process.env.AIRTABLE_TOKEN,
  baseId: process.env.AIRTABLE_BASE_ID || 'appNw0RvbOkZByR62',
  tableId: process.env.AIRTABLE_TABLE_ID || 'tbl4yhZTG24EDB6KE',
  publicLevel: process.env.AIRTABLE_PUBLIC_LEVEL || 'P2',
  syncMedia: process.env.SYNC_MEDIA || 'images',
  dryRun: process.env.SYNC_DRY_RUN === '1' || process.argv.includes('--dry-run'),
  limit: Number(process.env.SYNC_LIMIT || 0),
};

const FIELDS = {
  assetType: 'fldIRYJRlhrikwFSO',
  industry: 'fldPLyge031EjRslC',
  services: 'fldt3dlsS2KHygSru',
  caseId: 'fldURChK0jMvwwElt',
  clientInstitution: 'flduHU9qXfbehXziQ',
  projectYear: 'fldS449OoB6njs67P',
  country: 'fldccqSXfXIrd3FLZ',
  city: 'fldTMth9nVOpZmAet',
  headlineCn: 'fldeeDkhHVAWAgFTA',
  introCn: 'fldIO4Y2xG7ubi3V5',
  approach: 'fldit51NJJRhcjRZh',
  heroImage: 'fldlgjQn70UAXZ5tH',
  gallery: 'fldXMihM5rwP2AuQg',
  videos: 'fld6vrv1ck6oGIfno',
  clientNamePublic: 'fld2YGERxXgNdtZJr',
};

const FIELD_NAMES = {
  assetType: 'Asset Type',
  industry: 'Industry',
  services: 'Services',
  caseId: 'Case ID',
  clientInstitution: 'Client / Institution',
  projectYear: 'Project Year',
  country: 'Country',
  city: 'City',
  headlineCn: 'Case Headline CN',
  introCn: 'Case Intro CN',
  approach: 'Creative / Production Approach',
  heroImage: 'Hero Image',
  gallery: 'Case Gallery',
  videos: 'Case Videos',
  clientNamePublic: 'Client Name Public',
};

const IMAGE_MIME_EXTENSIONS = new Map([
  ['image/jpeg', 'jpg'],
  ['image/jpg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
  ['image/avif', 'avif'],
]);

function requireToken() {
  if (!CONFIG.token && !CONFIG.dryRun) {
    throw new Error('AIRTABLE_TOKEN is required. Add it as a local environment variable or GitHub Actions secret.');
  }
}

function value(fields, key) {
  return fields[FIELDS[key]] ?? fields[FIELD_NAMES[key]];
}

function textValue(fields, key) {
  const raw = value(fields, key);
  if (raw === undefined || raw === null) return '';
  if (typeof raw === 'string' || typeof raw === 'number') return String(raw).trim();
  if (Array.isArray(raw)) return raw.map(item => typeof item === 'object' ? item.name || item.value || '' : item).filter(Boolean).join(', ');
  if (typeof raw === 'object') return String(raw.name || raw.value || '').trim();
  return '';
}

function selectValues(fields, key) {
  const raw = value(fields, key);
  const values = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return values.map(item => typeof item === 'object' ? item.name || item.value : item).filter(Boolean).map(String);
}

function attachmentValues(fields, key) {
  const raw = value(fields, key);
  return Array.isArray(raw) ? raw.filter(item => item && item.url) : [];
}

function normalizeCaseId(raw) {
  const id = String(raw || '').trim();
  if (/^MS-\d+$/i.test(id)) return id.replace(/^MS-/i, 'MS-CA-');
  return id;
}

function formulaQuote(input) {
  return String(input).replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}

function safePathPart(input) {
  return String(input || 'unknown').replace(/[^a-zA-Z0-9._-]+/g, '-');
}

function getExtension(filename, mimeType) {
  const mime = String(mimeType || '').split(';')[0].toLowerCase();
  if (IMAGE_MIME_EXTENSIONS.has(mime)) return IMAGE_MIME_EXTENSIONS.get(mime);
  const ext = path.extname(String(filename || '')).slice(1).toLowerCase();
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'].includes(ext)) return ext === 'jpeg' ? 'jpg' : ext;
  return '';
}

function attachmentMetadata(attachment, url, extension) {
  return {
    url,
    filename: attachment.filename || `asset.${extension}`,
    type: attachment.type || 'image/' + extension,
    ...(attachment.width ? { width: attachment.width } : {}),
    ...(attachment.height ? { height: attachment.height } : {}),
    ...(attachment.size ? { size: attachment.size } : {}),
  };
}

async function airtableRecords() {
  const records = [];
  let offset;
  const fields = [...new Set(Object.values(FIELD_NAMES))];
  do {
    const params = new URLSearchParams({
      pageSize: '100',
      filterByFormula: `AND({Public Level}="${formulaQuote(CONFIG.publicLevel)}",{Asset Type}="Case")`,
    });
    for (const field of fields) params.append('fields[]', field);
    if (offset) params.set('offset', offset);
    const response = await fetch(`https://api.airtable.com/v0/${CONFIG.baseId}/${encodeURIComponent(CONFIG.tableId)}?${params}`, {
      headers: { Authorization: `Bearer ${CONFIG.token}` },
      signal: AbortSignal.timeout(60_000),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(`Airtable API ${response.status}: ${body.error?.message || 'request failed'}`);
    records.push(...(body.records || []));
    offset = body.offset;
  } while (offset);
  return records;
}

async function readExisting() {
  try {
    return JSON.parse(await readFile(DATA_FILE, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return { cases: [] };
    throw error;
  }
}

async function downloadAttachment(attachment, destination) {
  const attachmentType = String(attachment.type || '').toLowerCase();
  const attachmentExtension = path.extname(String(attachment.filename || '')).toLowerCase();
  const needsPreview = attachmentType === 'image/heic' || attachmentType === 'image/heif' || ['.heic', '.heif'].includes(attachmentExtension);
  const downloadUrl = needsPreview
    ? attachment.thumbnails?.full?.url || attachment.thumbnails?.large?.url || attachment.url
    : attachment.url;
  const response = await fetch(downloadUrl, { signal: AbortSignal.timeout(120_000) });
  if (!response.ok) throw new Error(`Attachment download ${response.status} for ${attachment.filename || attachment.id || 'unnamed file'}`);
  const contentType = response.headers.get('content-type') || attachment.type || '';
  const extension = getExtension(attachment.filename, contentType) || getExtension(attachment.filename, attachment.type);
  if (!extension) {
    throw new Error(`Unsupported image format for ${attachment.filename || attachment.id || 'unnamed file'} (${contentType || 'unknown type'}). Airtable did not provide a browser-readable thumbnail.`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(destination, bytes);
  return { contentType, extension, size: bytes.length };
}

async function buildCase(record, existing, tempCasesDir) {
  const fields = record.fields || {};
  const caseId = normalizeCaseId(textValue(fields, 'caseId'));
  if (!caseId) throw new Error(`A P2 Case record is missing Case ID (${record.id})`);

  const old = existing.byId.get(caseId);
  const hero = attachmentValues(fields, 'heroImage');
  if (!hero.length) throw new Error(`${caseId} has no Hero Image; sync stopped before publishing an empty case card.`);

  const caseDir = path.join(tempCasesDir, safePathPart(caseId));
  await mkdir(caseDir, { recursive: true });
  const media = { hero: [], gallery: [] };
  const imageFields = [
    ['hero', hero],
    ['gallery', attachmentValues(fields, 'gallery')],
  ];

  for (const [role, attachments] of imageFields) {
    for (let index = 0; index < attachments.length; index += 1) {
      const attachment = attachments[index];
      const extensionHint = getExtension(attachment.filename, attachment.type) || 'jpg';
      const attachmentKey = safePathPart(attachment.id || `${role}-${index + 1}`);
      const filename = `${role}-${String(index + 1).padStart(2, '0')}-${attachmentKey}.${extensionHint}`;
      const destination = path.join(caseDir, filename);
      const downloaded = await downloadAttachment(attachment, destination);
      const url = `assets/cases/${safePathPart(caseId)}/${filename}`;
      media[role].push({
        ...attachmentMetadata(attachment, url, downloaded.extension),
        type: downloaded.contentType || attachment.type || `image/${downloaded.extension}`,
        size: downloaded.size,
      });
    }
  }

  const next = {
    caseId,
    title: textValue(fields, 'headlineCn') || old?.title || '',
    titleEn: old?.titleEn || textValue(fields, 'headlineCn'),
    client: textValue(fields, 'clientNamePublic') || textValue(fields, 'clientInstitution') || old?.client || '',
    industry: textValue(fields, 'industry') || old?.industry || '',
    services: selectValues(fields, 'services'),
    year: textValue(fields, 'projectYear') || old?.year || '',
    country: textValue(fields, 'country') || old?.country || '',
    city: textValue(fields, 'city') || old?.city || '',
    intro: {
      zh: textValue(fields, 'introCn') || old?.intro?.zh || '',
      en: old?.intro?.en || '',
    },
    approach: {
      zh: textValue(fields, 'approach') || old?.approach?.zh || '',
      en: old?.approach?.en || '',
    },
    hero: media.hero.length ? media.hero : old?.hero || [],
    gallery: media.gallery,
    videos: old?.videos || [],
  };

  if (attachmentValues(fields, 'videos').length) {
    console.warn(`${caseId}: Case Videos found; video URLs remain from the existing snapshot. Phase 2 should move videos to permanent storage.`);
  }
  return next;
}

async function main() {
  requireToken();
  if (CONFIG.syncMedia !== 'images') throw new Error('Only SYNC_MEDIA=images is supported in Phase 1. Videos need permanent object storage before being committed to Git.');
  const existingJson = await readExisting();
  const existing = {
    cases: existingJson.cases || [],
    byId: new Map((existingJson.cases || []).map(item => [normalizeCaseId(item.caseId), item])),
  };
  const records = await airtableRecords();
  if (!records.length) throw new Error('Airtable returned no P2 Case records; sync stopped to protect the current site snapshot.');
  const selected = CONFIG.limit ? records.slice(0, CONFIG.limit) : records;
  console.log(`Found ${records.length} P2 Case records${CONFIG.limit ? `; processing ${selected.length} due to SYNC_LIMIT` : ''}.`);
  if (CONFIG.dryRun) {
    console.log('Dry run complete; no files were downloaded or changed.');
    return;
  }

  await rm(TEMP_DIR, { recursive: true, force: true });
  const tempCasesDir = path.join(TEMP_DIR, 'cases');
  await mkdir(tempCasesDir, { recursive: true });
  const builtById = new Map();
  for (const record of selected) {
    const item = await buildCase(record, existing, tempCasesDir);
    builtById.set(item.caseId, item);
  }

  if (!CONFIG.limit && builtById.size < 1) {
    throw new Error('No P2 Case records were built; sync stopped.');
  }

  const ordered = [];
  for (const item of existing.cases) {
    const id = normalizeCaseId(item.caseId);
    if (builtById.has(id)) ordered.push(builtById.get(id));
  }
  for (const item of builtById.values()) {
    if (!ordered.some(existingItem => existingItem.caseId === item.caseId)) ordered.push(item);
  }

  if (!CONFIG.limit) {
    await rm(ASSETS_DIR, { recursive: true, force: true });
    await rename(tempCasesDir, ASSETS_DIR);
    await writeFile(DATA_FILE, `${JSON.stringify({ cases: ordered }, null, 2)}\n`, 'utf8');
    await rm(TEMP_DIR, { recursive: true, force: true });
    console.log(`Synced ${ordered.length} cases and ${ordered.reduce((sum, item) => sum + item.hero.length + item.gallery.length, 0)} images.`);
  } else {
    await rm(TEMP_DIR, { recursive: true, force: true });
    console.log('Limited run completed without writing the repository snapshot.');
  }
}

main().catch(error => {
  console.error(`Airtable sync failed: ${error.message}`);
  process.exitCode = 1;
});
