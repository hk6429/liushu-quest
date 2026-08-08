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
const privacy = read('privacy.html');

assert.match(index, /data-view="home" class="active"/, '今日主線必須是預設首頁');
assert.match(app, /go\('home', \{ focus: false \}\)/, '資料載入後必須進入今日主線');
assert.equal((journey.match(/\{ title:/g) || []).length, 8, '故事旅程必須精確八卷');
assert.match(journey, /pendingChapter/, '未完章節必須可續接');
assert.match(journey, /漏一天不會歸零/, '每週節奏不得用中斷懲罰');
assert.match(journey, /run\.kind === 'chapter' \? chapterIds\(run\.chapter\) : null/, '今日五題不得被當前章節限制成概念題');
assert.match(story, /story-chapter/, '長故事必須分成短章呈現');
assert.match(story, /story-scene/, '每卷故事必須再拆成短幕');
assert.match(story, /aria-current.*step/, '故事分卷必須標示目前位置');
assert.match(story, /完成本卷，進入短試煉/, '章末必須連到提取練習');
assert.match(journey, /applyChapterResult\(save, run\.chapter, run\.right, run\.questions\)/, '章節試煉必須通過門檻才解鎖');
assert.match(journey, /chapter_trial/);
assert.match(journey, /home_daily/);

for (const type of ['axis', 'evidence', 'contrast', 'transfer']) {
  assert.match(quiz, new RegExp(`type === '${type}'`), `缺少 ${type} 題型`);
}
assert.match(progression, /distinctDays.*>= 2/s, '有效精通必須跨至少兩日');
assert.match(progression, /rationalePasses.*>= 1/s, '有效精通必須包含理由證據');
assert.match(progression, /axesForChar/, '雙軸字必須分開驗收');

assert.match(classroom, /第一次答案/);
assert.match(classroom, /第二次答案/);
assert.match(classroom, /data-phase="initial"/);
assert.match(classroom, /data-phase="discuss"/);
assert.match(classroom, /data-phase="revise"/);
assert.match(classroom, /initialCounts/);
assert.match(classroom, /revisedConfidence/);
assert.match(classroom, /匿名全班彙整/);
assert.match(classroom, /改變不是扣分/);
assert.doesNotMatch(classroom, /排行榜|速度榜|最快|最高分/, '課堂共學不得引入競速或排行榜');
assert.doesNotMatch(classroom, /<input[^>]+type="text"|name="student|studentName/, '課堂共學不得提供姓名輸入欄位');

assert.equal((index.match(/<button type="button" data-view=/g) || []).length, 6, '手機主導覽必須收斂為六個入口');
assert.match(index, /data-view="practice"/, '查字、閃卡、自測與對戰必須收進練功房');
assert.match(index, /liushu\.analytics\.optout/, '首頁載入統計前必須讀取退出設定');
assert.match(index, /defaultOpen = 'false'/, '平台工具不得預設展開');
assert.match(privacy, /關閉 GoatCounter 與平台到訪統計/);
assert.match(privacy, /不會自動上傳題目答案、學生姓名/);

console.log('✅ retention tests 通過：主線續接、八卷短章、四類深度題、跨日雙軸精通與匿名共學');
