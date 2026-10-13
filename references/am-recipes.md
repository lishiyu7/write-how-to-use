# am 用法速查（answer-me-with-html）

以下内容在 am 0.5.0 上实测过。换版本请重新确认第 4、5 节。

## 1 调用

CLI 是零依赖单文件，只需 Node 20+。

它随 `answer-me-with-html` 插件分发，**不在 PATH 上**，插件目录里还带版本号。所以现查路径，不要写死：

```bash
AM=$(ls -d ~/.claude/plugins/cache/answer-me-with-html/*/*/skills/answer-me-with-html/scripts/am.mjs | tail -1)
node "$AM" list      # 自检：能列出模板与组件就可用
```

渲染：

```bash
node "$AM" render - <<'AM_EOF'
---
template: doc
title: 标题
---
## 面板标题
内容
AM_EOF
```

也可以改为先调用 `answer-me-with-html` skill，按它给出的路径执行。

常用子命令：

| 命令 | 用途 |
|---|---|
| `render` | 渲染页面。整页重渲染用 `--replace <旧页面>`，旧页会被删掉 |
| `render -o` | 输出到指定路径。⚠️ 用 `-o` 写到仓库里时 **`--replace` 会直接报错**（它只认 am 自己写出的页面）。此时重渲染就是省掉 `--replace` 再跑一次，`-o` 会覆盖旧文件 |
| `list` | 列模板、主题、组件 |
| `help <component>` | 单个组件的语法 |
| `help format` | 草稿格式全量参考 |
| `lint` | 只跑 STE 检查 |
| `patch` | **不要用**，见 SKILL.md 踩坑第 1 条 |

## 2 模板与主题选择

- `template: doc` — 逐步阅读的说明文档。**交付文档用这个。**
- `template: sheet` — 一屏概览的网格看板。只在需要「一屏放完」时用。
- `theme` 三套：`blueprint`（图纸）、`shadcn`（卡片）、`paper`（纸张）。`auto` 时纯文字草稿走 paper，带图走 blueprint。

## 3 组件选择

| 信息的形状 | 组件 |
|---|---|
| 流程、架构、起手路径 | `flow`（`A -> B: 标签`，`-->` 虚线，`(圆角)`，`{判断?}`） |
| 层级、目录 | `tree` |
| 对比、能否清单 | Markdown 表格（状态列写 `ok` / `no` / `warn`） |
| 结论、警示 | `callout`（**围栏**，类型写在围栏参数里） |
| 键值、元信息 | `kv` |
| 历史阶段 | `timeline` |
| 数值与上限 | `limits` |
| 引用的真实代码 | 代码块加 `src=路径 lines=起始-结束` |
| 尚不存在的代码、命令、公式 | 代码块加 `title="说明"` |

`html` / `svg` 围栏是**逃生舱**，只在没有组件能表达时用。受众开关就是这种情况。

### 3.1 `callout` 是围栏，不是引用块

实测踩过的坑：把结论写成引用块 `> info 标题`，页面会把 `info 标题` 当**普通引用文字原样显示**。
**不报错、STE 也不拦**，只有打开页面才看得出。同批还错了 3 处，都是同一个写法。

正解 —— 围栏，类型和标题写在围栏参数里：

````
```callout warn 标题
正文，支持 Markdown 与表格。

空行分段。
```
````

- 第一个参数是类型：`info` / `ok` / `warn` / `err`。
- 第二个参数是标题，可省略。
- 类型写错或省略时，整串参数当标题，类型回落 `info`。
- 引用块 `> ...` 照样能用，但那是引用，**不是** callout。

**自查**：`am render` 结尾会打印组件计数（如 `callout×4 flow×1`）。
这个数和你草稿里写的数量对不上，就是有组件没生效。

## 4 主题变量（让自定义控件跟随换肤）

页面没有 `:root` 变量，变量都声明在 `html[data-theme="X"][data-mode="Y"]` 选择器里。自定义控件**必须**用这些变量，不要写死颜色，否则换主题或切明暗会脱节。

| 变量 | 用途 |
|---|---|
| `--paper` | 控件底色 |
| `--ink` / `--ink-2` / `--ink-3` | 主文字 / 次文字 / 弱文字与占位 |
| `--line` / `--line-2` | 强分隔线 / 弱描边 |
| `--fill` | 悬停或填充底色 |
| `--head-bg` / `--head-fg` | **成对的高对比前景/背景**，各主题与明暗下都保证可读。做「选中态」用它 |
| `--accent` / `--accent-bg` | 强调色 |
| `--radius` / `--bw` | 圆角半径 / 描边宽度 |

可以照抄页面自带控件 `.am-btn` 的写法：

```css
.my-btn {
  font: 12px/1 var(--font-sans);
  color: var(--ink);
  background: var(--paper);
  border: 1px solid var(--line-2);
  border-radius: var(--radius);
  padding: 7px 10px;
  cursor: pointer;
}
```

## 5 受众开关（页内身份隔离）

`am` 没有面板级受众属性，用 `html` 围栏自建。以下是实测可用的完整实现。

要点：

- 被隐藏的内容包一层 `<div class="am-dev-only">`。
- 承载它的面板必须写 `{bare}`（去掉标题栏），否则面板标题仍可见。
- 脚本用 `closest('.am-panel')` 找到并隐藏整个面板，同时隐藏目录项。
- 默认隐藏，且带 CSS 兜底（JS 未执行时也不显示）。

放在页面第二个面板（`## 阅读身份 {bare}`），开关就在正文顶部：

````html
<div class="am-aud-bar">
  <span class="am-aud-lbl">阅读身份</span>
  <span class="am-aud-group">
    <button type="button" class="am-aud-btn am-on" data-aud="user">运营</button>
    <button type="button" class="am-aud-btn" data-aud="dev">开发</button>
  </span>
</div>
<style>
.am-aud-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font:12px/1 var(--font-sans)}
.am-aud-lbl{color:var(--ink-3)}
.am-aud-group{display:inline-flex}
.am-aud-btn{font:inherit;color:var(--ink);background:var(--paper);border:1px solid var(--line-2);border-radius:0;padding:7px 12px;cursor:pointer}
.am-aud-btn + .am-aud-btn{border-inline-start:0}
.am-aud-btn:hover{border-color:var(--ink-3)}
.am-aud-btn.am-on{background:var(--head-bg);color:var(--head-fg);border-color:var(--head-bg)}
html:not(.am-dev) .am-dev-only{display:none}
</style>
<script>
(function(){
  function show(el,dev){
    var p=el.closest('.am-panel'), t=p||el;
    t.style.display = dev ? '' : 'none';
    if(p&&p.id){
      document.querySelectorAll('.am-toc a[href="#'+p.id+'"]').forEach(function(a){ a.style.display = dev ? '' : 'none'; });
    }
  }
  function apply(dev){
    document.documentElement.classList.toggle('am-dev',dev);
    document.querySelectorAll('.am-dev-only').forEach(function(el){ show(el,dev); });
    document.querySelectorAll('.am-aud-btn').forEach(function(b){
      b.classList.toggle('am-on',(b.getAttribute('data-aud')==='dev')===dev);
    });
  }
  document.addEventListener('click',function(e){
    var b=e.target.closest&&e.target.closest('.am-aud-btn'); if(!b) return;
    apply(b.getAttribute('data-aud')==='dev');
  });
  function boot(){ apply(false); }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',boot);}else{boot();}
})();
</script>
````

开发者附录面板的写法：

````markdown
## 开发者附录 {bare}
```html
<div class="am-dev-only am-md">
<h3>开发者附录</h3>
<div class="am-table-wrap"><table>…</table></div>
</div>
```
````

🔴 **`am-md` 这个类不能少。** `html` 逃生舱里的内容**不在 am 的正文容器内**，am 的那套 Markdown 样式
（`.am-md table` / `.am-md h3,h4` / `.am-md :not(pre) > code` / `.am-md p`）一条都命中不到 ——
表格会退化成浏览器默认样式（挤在一起、无内边距、无斑马纹）。实测被用户当场指出「阅读体验很差」。

- 加 `am-md` 后无需手写任何 CSS，标题、表格、行内代码、段落间距全部跟随主题与明暗切换。
- 表格各包一层 `am-table-wrap`，拿横向滚动（am 给 Markdown 表格加的就是这层）。
- 佐证：am 自己给 callout 正文加的类就是 `am-callout-body am-md`。

## 6 STE 中文受控写作

`render` 自动检查，默认只告警；`style: strict` 时不合格不出页面。

高频被拦项：

- 单句长度：步骤 35 字以内，说明 45 字以内。超了拆句。
- 段落最多 6 句。列表、表格、代码块不算句子，复杂内容改用列表。
- 数字后不用「以上 / 以下 / 以内」：写「大于 / 不小于 / 不超过」。
- 模糊量词：「尽快 / 若干 / 大概 / 多次」都被拦，写出具体数。
- 同义反复：「单击 → 点击」「键入 → 输入」「入参 → 参数」。
- 轻动词：「进行优化 → 优化」「加以说明 → 说明」。
- 不要连三个以上的「的」。

## 7 渲染后的静态核验

没有浏览器也能查出大部分问题，见 [grounding-checklist.md](grounding-checklist.md)。
