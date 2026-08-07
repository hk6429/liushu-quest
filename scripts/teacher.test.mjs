#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function render(file, symbol) {
  const source = readFileSync(join(root, file), 'utf8');
  const context = {};
  vm.runInNewContext(`${source}\n;globalThis.component = ${symbol};`, context, { filename: file });
  const target = {};
  context.component.render(target);
  assert.equal(typeof target.innerHTML, 'string', `${file} 必須輸出 HTML`);
  return { source, html: target.innerHTML };
}

const concept = render('js/concept.js', 'LSConcept');
const story = render('js/story.js', 'LSStory');
const order = ['象形', '指事', '會意', '假借', '形聲', '轉注'];

function assertInOrder(html, labels, scope) {
  const plain = html.replace(/<[^>]*>/g, '');
  let cursor = -1;
  for (const label of labels) {
    const next = plain.indexOf(`${label}：`, cursor + 1);
    assert.ok(next > cursor, `${scope} 的 ${label} 章次序錯誤或缺漏`);
    cursor = next;
  }
}

// T01：學習目標與可觀察的成功標準。
assert.match(concept.html, /這一課要學會什麼/);
assert.match(concept.html, /我判斷是＿＿，因為＿＿/);

// T02：形、音、義是觀察面向，不宣稱一字一音一義。
for (const page of [concept.html, story.html]) {
  assert.match(page, /三個面向/);
  assert.match(page, /多個讀音|多音字/);
}

// T03：概念頁與故事採同一教學編排，明示非《說文》原序並阻斷年代誤讀。
assertInOrder(concept.html, order, '概念頁');
assertInOrder(story.html, order, '故事頁');
for (const page of [concept.html, story.html]) {
  assert.match(page, /本站.*教學編排/);
  assert.match(page, /不是《說文解字．敘》的原序/);
  assert.match(page, /不是.*時間表/);
  assert.match(page, /指事、象形、形聲、會意、轉注、假借/);
}

// T04：改為國中可操作的判讀語言，不再標示「小學生版」。
assert.doesNotMatch(concept.source, /小學生版/);
assert.equal((concept.html.match(/國中判讀/g) || []).length, 6, '六章都要有國中判讀鷹架');

// T05：象形與指事有直接對比及可說明的部件／記號判準。
assert.match(concept.html, /為什麼「本」不歸象形/);
assert.match(concept.html, /「本」和「休」.*如何區分/);
assert.match(concept.html, /前者指事，後者會意/);

// T06：會意的重複與看圖聯想都有反過度類推護欄。
assert.match(concept.html, /相同部件重複<b>不等於永遠/);
assert.match(story.html, /重複部件不保證一律表示/);
assert.match(concept.html, /不能把所有看圖聯想都當成造字證據/);

// T07：形聲不再以「半邊」誤導比例，明示兩部分不一定各占一半。
assert.doesNotMatch(concept.source, /半邊表義|半邊表音/);
assert.doesNotMatch(story.source, /一半用/);
for (const page of [concept.html, story.html]) assert.match(page, /不一定各占.*一半/);

// T08：形聲判讀包含義、音、證據，且位置只是觀察線索。
assert.match(concept.html, /義、音、證據三步查/);
assert.match(concept.html, /位置只協助觀察，不是分類答案/);
assert.match(story.html, /位置只能協助觀察，部件功能才是判斷重點/);

// T09：學生端有一字兩問的雙軸示範，不把莫、考硬塞成單一類別。
assert.match(concept.html, /一字兩問/);
assert.match(concept.html, /<b>莫<\/b>：字形構成＝會意；借作否定詞＝假借關係/);
assert.match(concept.html, /<b>考<\/b>：字形構成＝形聲；與「老」互訓＝轉注關係/);
assert.match(story.html, /「考」本身的構形是形聲/);

// T10：長篇閱讀有分段提取練習與離堂任務。
assert.ok((concept.html.match(/<details>/g) || []).length >= 7, '概念頁至少要有六章檢核與離堂檢核');
assert.equal((story.html.match(/<summary>停看聽/g) || []).length, 6, '故事六章各需一個停看聽');
assert.match(story.html, /<b>離堂任務：<\/b>/);

console.log('✅ teacher round2 tests 通過：T01–T10 教學鷹架與文案護欄全部成立');
