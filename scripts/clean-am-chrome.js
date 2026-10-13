#!/usr/bin/env node
/**
 * 去掉 answer-me-with-html 页面里的「读者交互」chrome，产出一份可交付的干净页面。
 *
 * 去掉的东西：
 *   - 工具条上的「回复」按钮         data-am="reply"
 *   - 工具条上的「标注」按钮         data-am="remark"
 *   - 工具条上的「复制草稿」按钮     data-am="copy"
 *   - 代码块上的「复制」按钮         data-am="copy-code"
 *   - 隐藏的草稿副本                 <textarea id="am-source">（默认删，见下）
 *
 * 保留的东西：
 *   - 主题 / 明暗下拉               data-am="theme" / data-am="mode"
 *   - 图片灯箱（页面里有图时才有意义）
 *   - 你自己的自定义脚本
 *
 * 用法：
 *   node clean-am-chrome.js <输入.html> [输出.html] [--keep-source]
 *
 * 不传输出路径则原地覆盖。--keep-source 保留草稿副本；保留后该页面仍可被 `am patch`
 * 修改，代价是文件更大，且草稿原文（含被隐藏的受众内容）留在源码里。
 *
 * 为什么删元素而不改脚本：
 *   am 运行时的每个交互特性都有守卫，按钮不在就整段不注册——
 *     - 回复：`if (replyBtn) { ... }`，每个面板的评论按钮也在这个块内
 *     - 标注：`const btn = document.querySelector('[data-am="remark"]'); if (!btn) return;`
 *     - 复制：`copyBtn?.addEventListener(...)` 与 `querySelectorAll(...)` 空集合
 *   该结论是在 am 0.5.0 上读源码核实的。换版本请重新确认守卫是否还在。
 */

'use strict';

const fs = require('fs');

const argv = process.argv.slice(2);
const keepSource = argv.includes('--keep-source');
const paths = argv.filter((a) => !a.startsWith('--'));
const input = paths[0];
const output = paths[1] || input;

if (!input) {
  console.error('用法: node clean-am-chrome.js <输入.html> [输出.html] [--keep-source]');
  process.exit(2);
}

let html = fs.readFileSync(input, 'utf8');
const before = html.length;
const report = [];

// 用正则字面量，不要用 new RegExp 拼字符串：反斜杠在多层转义里会丢。
const BUTTONS = [
  ['回复', /<button[^>]*data-am="reply"[^>]*>[\s\S]*?<\/button>/g],
  ['标注', /<button[^>]*data-am="remark"[^>]*>[\s\S]*?<\/button>/g],
  ['复制草稿', /<button[^>]*data-am="copy"[^>]*>[\s\S]*?<\/button>/g],
  ['代码复制', /<button[^>]*data-am="copy-code"[^>]*>[\s\S]*?<\/button>/g],
];

for (const [label, re] of BUTTONS) {
  const hits = html.match(re) || [];
  if (hits.length === 0) {
    report.push(`${label}: 未找到（已处理过，或该版本没有此按钮）`);
    continue;
  }
  html = html.replace(re, '');
  report.push(`${label}: 移除 ${hits.length} 个`);
}

if (keepSource) {
  report.push('草稿副本: 保留（--keep-source）');
} else {
  const open = '<textarea id="am-source"';
  const start = html.indexOf(open);
  if (start < 0) {
    report.push('草稿副本: 未找到（已处理过？）');
  } else {
    const closer = '</textarea>';
    const end = html.indexOf(closer, start);
    if (end < 0) {
      console.error('草稿副本的 </textarea> 未找到，文件可能已损坏。未写出任何文件。');
      process.exit(1);
    }
    html = html.slice(0, start) + html.slice(end + closer.length);
    report.push('草稿副本: 已移除');
  }
}

fs.writeFileSync(output, html);

console.log('清理结果：');
for (const line of report) console.log('  ' + line);
const saved = ((1 - html.length / before) * 100).toFixed(1);
console.log(`  ${input}  ${before}B  ->  ${output}  ${html.length}B  (小 ${saved}%)`);
console.log('');
console.log('请再跑一次静态核验（见 references/grounding-checklist.md）：');
console.log('  - <button 逐个数，确认剩下的都是你自己的控件');
console.log('  - 主题/明暗下拉仍在');
console.log('  - 结尾是 </html>');
