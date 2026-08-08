#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFileSync(join(root, file), 'utf8');
const index = read('index.html');
const app = read('js/app.js');
const journey = read('js/journey.js');
const story = read('js/story.js');
const classroom = read('js/classroom.js');
const quiz = read('js/quiz.js');
const progression = read('js/progression.js');

assert.match(index, /data-view="home" class="active"/, '今日主線必須是預設首頁');
assert.match(app, /go\('home', \{ focus: false \}\)/, '資料載入後必須進入今日主線');
assert.equal((journey.match(/\{ title:/g) || []).length, 8, '故事旅程必須精確八卷');
assert.match(journey, /pendingChapter/, '未完章節必須可續接');
assert.match(journey, /漏一天不會歸零/, '每週節奏不得用中斷懲罰');
assert.match(journey, /run\.kind === 'chapter' \? chapterIds\(run\.chapter\) : null/, '今日五題不得被當前章節限制成概念題');
assert.match(story, /story-chapter/, '長故事必須分成短章呈現');
assert.match(story, /完成本卷，進入短試煉/, '章末必須連到提取練習');

for (const type of ['axis', 'evidence', 'contrast', 'transfer']) {
  assert.match(quiz, new RegExp(`type === '${type}'`), `缺少 ${type} 題型`);
}
assert.match(progression, /distinctDays.*>= 2/s, '有效精通必須跨至少兩日');
assert.match(progression, /rationalePasses.*>= 1/s, '有效精通必須包含理由證據');
assert.match(progression, /axesForChar/, '雙軸字必須分開驗收');

assert.match(classroom, /第一次答案/);
assert.match(classroom, /第二次答案/);
assert.match(classroom, /匿名全班彙整/);
assert.match(classroom, /改變不是扣分/);
assert.doesNotMatch(classroom, /排行榜|速度榜|最快|最高分/, '課堂共學不得引入競速或排行榜');
assert.doesNotMatch(classroom, /<input[^>]+type="text"|name="student|studentName/, '課堂共學不得提供姓名輸入欄位');

console.log('✅ retention tests 通過：主線續接、八卷短章、四類深度題、跨日雙軸精通與匿名共學');
