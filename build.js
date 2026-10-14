#!/usr/bin/env node
/**
 * فا | اسکریپت ساخت بسته‌های چندمرورگری
 * نسخه ۲.۰.۰
 *
 * از یک منبع مشترک (فایل‌های همین پوشه) دو بسته‌ی آماده‌ی نصب می‌سازد:
 *
 *   dist/FA-v<version>-chrome/     → بارگذاری unpacked در Chrome / Edge / Opera
 *   dist/FA-v<version>-firefox/    → بارگذاری در Firefox (about:debugging)
 *   dist/FA-v<version>-chrome.zip
 *   dist/FA-v<version>-firefox.xpi
 *
 * تفاوت دو بسته فقط فایل manifest است:
 *   • کروم/اج/اپرا → manifest.json        (background.service_worker)
 *   • فایرفاکس     → manifest.firefox.json (background.scripts)
 *
 * اجرا:  node build.js
 * نیازمندی: فقط Node.js (بدون هیچ وابستگی خارجی — ZIP با zlib داخلی ساخته می‌شود)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');

/* فایل‌ها/پوشه‌های مشترکی که داخل هر دو بسته کپی می‌شوند. */
const SHARED = [
  'content.js',
  'background.js',
  'exclusions.js',
  'dictionary.js',
  'excluded-domains-data.js',
  'popup.html',
  'popup.css',
  'popup.js',
  'panel-fonts.css',
  'options.html',
  'options.css',
  'options.js',
  'fonts',
  'icons'
];

const TARGETS = [
  { name: 'chrome',  manifest: 'manifest.json',         archive: 'zip' },
  { name: 'firefox', manifest: 'manifest.firefox.json', archive: 'xpi' }
];

/* ─────────────────────────── ابزارهای کمکی ─────────────────────────── */

function readVersion() {
  const m = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
  return m.version;
}

function copyRecursive(src, dst) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dst, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dst, entry));
    }
  } else {
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
  }
}

function walk(dir, base, out) {
  base = base || dir;
  out = out || [];
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, base, out);
    else out.push({ full, rel: path.relative(base, full).split(path.sep).join('/') });
  }
  return out;
}

/* ─────────────────────────── ZIP (بدون وابستگی) ─────────────────────────── */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

/**
 * ساخت یک فایل ZIP از فهرست {name, data}. از deflate خام استفاده می‌کند.
 */
function makeZip(entries) {
  const chunks = [];
  const central = [];
  let offset = 0;

  const DOS_TIME = 0;
  const DOS_DATE = (1 << 5) | 1; /* 1980-01-01 */

  for (const { name, data } of entries) {
    const nameBuf = Buffer.from(name, 'utf8');
    const crc = crc32(data);
    const compressed = zlib.deflateRawSync(data, { level: 9 });

    const useDeflate = compressed.length < data.length;
    const payload = useDeflate ? compressed : data;
    const method = useDeflate ? 8 : 0;

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);           /* version needed */
    local.writeUInt16LE(0, 6);            /* flags */
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(DOS_TIME, 10);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(payload.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);

    chunks.push(local, nameBuf, payload);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);              /* version made by */
    cd.writeUInt16LE(20, 6);              /* version needed */
    cd.writeUInt16LE(0, 8);               /* flags */
    cd.writeUInt16LE(method, 10);
    cd.writeUInt16LE(DOS_TIME, 12);
    cd.writeUInt16LE(DOS_DATE, 14);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(payload.length, 20);
    cd.writeUInt32LE(data.length, 24);
    cd.writeUInt16LE(nameBuf.length, 28);
    cd.writeUInt16LE(0, 30);              /* extra len */
    cd.writeUInt16LE(0, 32);              /* comment len */
    cd.writeUInt16LE(0, 34);              /* disk start */
    cd.writeUInt16LE(0, 36);              /* internal attrs */
    cd.writeUInt32LE(0, 38);              /* external attrs */
    cd.writeUInt32LE(offset, 42);         /* local header offset */
    central.push(cd, nameBuf);

    offset += local.length + nameBuf.length + payload.length;
  }

  const centralBuf = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...chunks, centralBuf, eocd]);
}

/* ─────────────────────────── ساخت ─────────────────────────── */

function main() {
  const version = readVersion();
  console.log('فا | ساخت نسخه ' + version);

  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  for (const target of TARGETS) {
    const dirName = 'FA-v' + version + '-' + target.name;
    const outDir = path.join(DIST, dirName);
    fs.mkdirSync(outDir, { recursive: true });

    for (const item of SHARED) {
      const src = path.join(ROOT, item);
      if (!fs.existsSync(src)) {
        console.warn('  ! نادیده گرفته شد (وجود ندارد): ' + item);
        continue;
      }
      copyRecursive(src, path.join(outDir, item));
    }

    /* مانیفست مخصوص هر مرورگر با نام استاندارد manifest.json کپی می‌شود */
    fs.copyFileSync(path.join(ROOT, target.manifest), path.join(outDir, 'manifest.json'));

    /* ساخت آرشیو */
    const files = walk(outDir);
    const entries = files.map(f => ({ name: f.rel, data: fs.readFileSync(f.full) }));
    const archiveName = dirName + '.' + target.archive;
    fs.writeFileSync(path.join(DIST, archiveName), makeZip(entries));

    const sizeKb = (fs.statSync(path.join(DIST, archiveName)).size / 1024).toFixed(0);
    console.log('  ✓ ' + dirName + '/  (' + files.length + ' فایل)  →  ' + archiveName + '  [' + sizeKb + ' KB]');
  }

  console.log('تمام. خروجی‌ها در پوشه dist/');
}

main();
