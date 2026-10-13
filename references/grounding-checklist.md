# 取证清单与交付前核验清单

## 一 取证：从代码里拿事实

读代码，不读旧文档。README 和 docs 会过期，代码不会。

### 入口

| 要拿的东西 | 去哪找 |
|---|---|
| 页面路由 | 页面 controller 的 `@GetMapping`；看有没有 `redirect` 落地页 |
| 视图文件 | controller `return "xxx"` 指向的模板 |
| 接口 | `@RestController` 的 `@RequestMapping` + 方法映射 |
| 身份链路 | 身份过滤器、`X-Operator` 之类的请求头、session 键名 |
| 权限门禁 | profile 判断逻辑、覆盖策略类 |

### 每个页面必查

- **有哪些控件**：顶部筛选、下拉、按钮、开关，逐个看 HTML 或模板。
- **每个控件的可见条件**：不要只看元素在不在，要看 JS 里有没有 `if (某某) { 显示 }`。很多控件是条件显示的。
- **同义控件的形态差异**：同一个功能在不同角色下可能是不同控件（页签 vs 下拉框）。找到分支条件再写。
- **表格列定义**：列名、tooltip 文案、默认隐藏与否。**口径常常只写在 tooltip 里**，别漏。
- **默认值**：参数默认值往往写在 tooltip 或列定义里。
- **计算公式**：搜公式的原文，照抄，不要自己推。

### 注意

- 服务端和前端可能各有一套同名逻辑（例如「健康状态」在服务端算一次、前端再算一次）。口径以页面实际取值的那个为准。
- 有开关控制显示/隐藏的列，写文档时要说明默认可见性。

## 二 交付前核验：静态检查

没有浏览器也能查出大部分问题。**用 `split` 计数，不要用正则**（本环境写文件会吞反斜杠）。

把下面这段写成文件再跑，比 `node -e` 安全：

```js
const fs = require('fs');
const h = fs.readFileSync('页面.html', 'utf8');
const c = (s) => h.split(s).length - 1;

// 结构
console.log('面板数', c('<section class="am-panel'));
console.log('目录项', c('href="#panel-'));
console.log('结尾完整', h.trimEnd().endsWith('</html>'));

// 自定义 JS 是否原样落进页面（被转义 = 没生效）
console.log('活体脚本', c('function apply(dev)'));

// 组件是否真的渲染成组件（写成引用块或纯文本时不会渲染，且 STE 不拦）
console.log('渲染的 callout', c('class="am-callout am-callout--'));
console.log('渲染的 flow   ', c('class="am-diagram am-flow"'));
console.log('逃生舱带 am-md', c('class="am-dev-only am-md"'));

// 泄漏：正文区（草稿副本之前）不应出现被转义的标签
const src = h.indexOf('id="am-source"');
const body = h.slice(0, src < 0 ? h.length : src);
console.log('泄漏 </textarea>', body.split('&lt;/textarea').length - 1);
console.log('泄漏 <script>', body.split('&lt;script&gt;').length - 1);

// 旧内容残留
console.log('旧域名残留', c('旧地址'));
```

> ⚠️ **用 `split` 计数时，字符串要写全**。给包装 div 加了第二个类（`class="am-dev-only am-md"`）之后，再数 `class="am-dev-only"`（带右引号）会得 0，误判成「开关丢了」。要数字符串本身，或改成数类名 token。

### 判定

| 检查 | 期望 |
|---|---|
| 面板数、目录项数 | 与设计一致 |
| 结尾完整 | `true` |
| 活体脚本 | 等于你注入的脚本块数（通常 1） |
| **渲染的组件计数** | 与你草稿里写的组件数一致。少一个 = 有组件没生效（常见成因：写成引用块而非围栏） |
| 逃生舱带 `am-md` | 有受众开关时是 `1`。为 `0` 说明附录表格没样式 |
| 泄漏两项 | 都是 `0`。非 0 说明页面被写坏了，重渲染 |
| 旧内容残留 | `0` |

`am render` 结尾也会打印组件计数（如 `flow×1 callout×4`），可与上表互校。

### 交付版额外检查

去掉交互按钮后：

- `data-am="reply"`、`data-am="remark"`、`data-am="copy"`、`data-am="copy-code"` 的**元素**应为 0。
  残余的字样只应出现在**脚本字符串和 CSS 规则**里（那是正常的、不渲染的）。
  判断方法：查 `<button` 的实际出现位置，逐个确认是静态元素还是 JS 模板字符串。
- 保留的控件（例如主题/明暗下拉）应仍在。
- 文件应比主文件小。

### 无法静态核验的部分

- 开关点击是否真的生效、主题切换是否跟随。**如实说明只做了静态核验**，请用户打开确认。
- 视觉排版、图表连线是否重叠。
