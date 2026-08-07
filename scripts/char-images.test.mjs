#!/usr/bin/env node
import { readFile, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const chars = JSON.parse(await readFile(join(root, 'data/chars.json'), 'utf8'));
const manifest = JSON.parse(await readFile(join(root, 'docs/char-image-provenance.json'), 'utf8'));
const imageDir = join(root, 'img/chars');
const files = (await readdir(imageDir)).filter(name => name.endsWith('.webp')).sort();
const expected = chars.map(char => `${char.id}.webp`).sort();

if (JSON.stringify(files) !== JSON.stringify(expected)) {
  const actual = new Set(files), wanted = new Set(expected);
  const missing = expected.filter(name => !actual.has(name));
  const extra = files.filter(name => !wanted.has(name));
  throw new Error(`字例配圖不完整：missing=${missing.join(',') || 'none'} extra=${extra.join(',') || 'none'}`);
}
if (!Array.isArray(manifest) || manifest.length !== chars.length) throw new Error(`配圖來源清冊應有 ${chars.length} 筆`);

const manifestById = Object.fromEntries(manifest.map(item => [item.id, item]));
for (const char of chars) {
  const path = join(imageDir, `${char.id}.webp`);
  const data = await readFile(path);
  if (data.toString('ascii', 0, 4) !== 'RIFF' || data.toString('ascii', 8, 12) !== 'WEBP') throw new Error(`${char.id} 不是 WebP`);
  const chunk = data.toString('ascii', 12, 16);
  let width, height;
  if (chunk === 'VP8 ') {
    width = data.readUInt16LE(26) & 0x3fff;
    height = data.readUInt16LE(28) & 0x3fff;
  } else if (chunk === 'VP8X') {
    width = 1 + data.readUIntLE(24, 3);
    height = 1 + data.readUIntLE(27, 3);
  } else if (chunk === 'VP8L') {
    const bits = data.readUInt32LE(21);
    width = 1 + (bits & 0x3fff);
    height = 1 + ((bits >> 14) & 0x3fff);
  } else {
    throw new Error(`${char.id} 使用未知 WebP chunk ${chunk}`);
  }
  if (width * 9 !== height * 16) throw new Error(`${char.id} 不是 16:9：${width}x${height}`);
  if ((await stat(path)).size > 250_000) throw new Error(`${char.id} 超過 250KB，會拖慢字例總覽`);
  const digest = createHash('sha256').update(data).digest('hex');
  const item = manifestById[char.id];
  if (!item || item.char !== char.char || item.path !== `img/chars/${char.id}.webp` || item.sha256 !== digest) {
    throw new Error(`${char.id} 的來源清冊不符`);
  }
  if (item.generator !== 'OpenAI image generation via Codex built-in tool' || item.style !== 'picture3 單字情境圖') {
    throw new Error(`${char.id} 缺生成服務或風格紀錄`);
  }
}

console.log(`✅ char-images 通過：${files.length} 張 picture3 單字情境圖均為 16:9、低於 250KB，且來源 SHA-256 完整`);
