# write-how-to-use

A Claude Code skill that turns a codebase into **delivery-grade documentation**.

[中文](#中文) · [English](#english)

---

# 中文

一个 Claude Code skill：**从代码库产出「交付级说明文档」**。

面向刚接手系统的人 —— 新同事、接手项目的运营、要交付给客户的实施同学 —— 产出一份
**单文件 HTML 说明书**：双击即开、可邮件转发、无外部依赖。

## 解决什么问题

系统上线了，但「怎么用」散在代码、口头交接和过期的旧文档里。新来的人从哪起手没人讲得清；
把运维细节一股脑塞给业务读者又没人看得懂。

这个 skill 把「读代码 → 定受众 → 写草稿 → 渲染 → 出交付版 → 核验」固化成一条流程。

## 产出长什么样

一份单文件 HTML，同一页内**按受众隔离**：

- **运营 / 业务读者**：怎么操作、看到什么数字、数字什么口径。
- **开发 / 运维读者**：入口地址、端口、部署、profile 门禁、API 路径。

两类读者看同一页，用页内开关切换。**不拆成两份文件** —— 用户一定会拿错。

同时产出一份**可对外发送的干净版**：剥掉渲染器自带的「回复 / 标注 / 复制」交互按钮，
并物理删掉开发者附录。

## 安装

```bash
git clone git@github.com:lishiyu7/write-how-to-use.git
cp -r write-how-to-use ~/.claude/skills/
```

或直接把 `SKILL.md`、`references/`、`scripts/` 拷进 `~/.claude/skills/write-how-to-use/`。

### 依赖

渲染依赖 **`answer-me-with-html`** skill 提供的 `am` CLI。没装的话第 3 步渲染跑不起来。

## 用法

在 Claude Code 里直接说：

- 「写一份使用说明」
- 「把 XX 系统讲清楚，让新同事能起手」
- 「出一份交付文档 / 上手文档 / 新手指引 / 说明书」

触发后 skill 会先问清受众分几类，然后读代码取证，再产出 HTML。

**不适用**：一句话能答完的问题；纯 API / 字段文档（那是 OpenAPI 或 javadoc 的活）。

## 两条硬原则

这套流程里最值钱的部分，是被实测纠正过的两条：

1. **每条断言回到代码取证。** 控件是否可见、默认值多少、公式怎么算、谁有权限，都要在代码里找到出处。
   凭页面印象写必然出错 —— 实测中「站点页签人人都有」和「随时可批量设置」两处都是凭印象写错的：
   实际形态随角色变（普通用户是页签，管理用户是双多选下拉框），批量按钮只在单站点视图出现。
2. **不发明。** 截图、数据、字段、接口一律不许编。没有就去问用户要，或写成待补。
   渲染工具本身也禁止生成图片。

## 结构

```
SKILL.md                              # 主流程：何时用 / 硬原则 / 6 步流程 / 7 条踩坑
references/am-recipes.md              # am 调用方式、模板选择、主题变量、受众开关代码、STE 规则
references/grounding-checklist.md     # 取证清单 + 交付前核验清单
scripts/clean-am-chrome.js            # 去掉读者交互按钮，生成交付版
```

`SKILL.md` 里的「踩坑」一节记录了 7 个真实踩过的坑，比如 `am patch` 会写坏页面
（只能用整页 `am render --replace`）、`callout` 是围栏不是引用块（写错了 STE 不拦、只有打开页面才看得出）、
`html` 逃生舱里的内容拿不到 am 样式（得给包装 div 加 `am-md` 类）。

---

# English

A Claude Code skill that turns a codebase into **delivery-grade documentation**.

It is aimed at whoever picks the system up next — a new teammate, an operator taking over
a project, an implementation engineer handing it to a client — and produces a **single-file
HTML manual**: open it by double-clicking, forward it by email, no external dependencies.

## The problem it solves

The system shipped, but *how to use it* is scattered across source code, verbal handovers,
and stale docs. Nobody can explain where a newcomer should start, and dumping ops details on
a business reader helps no one.

This skill fixes the path: **read the code → define the audiences → draft → render →
produce the delivery copy → verify**.

## What it produces

One single-file HTML page, with **per-audience isolation inside the same page**:

- **Business / operations readers**: what to click, what numbers they see, what those numbers mean.
- **Developer / ops readers**: entry URLs, ports, deployment, profile gates, API paths.

Both audiences read the same page and toggle between views in-page. It is deliberately
**not split into two files** — users always grab the wrong one.

It also produces a **clean copy you can send externally**: the renderer's built-in
reply / annotate / copy buttons are stripped, and the developer appendix is physically removed.

## Install

```bash
git clone git@github.com:lishiyu7/write-how-to-use.git
cp -r write-how-to-use ~/.claude/skills/
```

Or just copy `SKILL.md`, `references/`, and `scripts/` into `~/.claude/skills/write-how-to-use/`.

### Dependency

Rendering depends on the `am` CLI provided by the **`answer-me-with-html`** skill.
Without it, step 3 (render) will not run.

## Usage

In Claude Code, just say:

- "Write a user guide"
- "Explain system X so a new colleague can get started"
- "Produce a delivery doc / onboarding doc / getting-started guide"

The skill first asks how many audience types you have, then reads the code for evidence,
then produces the HTML.

**Not for**: questions answerable in one line; pure API / field reference docs
(that is OpenAPI's or javadoc's job).

## Two hard rules

The most valuable part of this workflow is the two rules that were corrected by real mistakes:

1. **Every claim must be grounded in code.** Whether a control is visible, what its default is,
   how a formula computes, who has permission — find the source. Writing from a glance at the UI
   is guaranteed to be wrong: in testing, "everyone has the site tab" and "bulk-set at any time"
   were both wrong from guesswork — the control's shape changes with the role (regular users get
   a tab, admin users get dual multi-select dropdowns), and the bulk button only appears in the
   single-site view.
2. **Do not invent.** Screenshots, data, fields, and endpoints must never be fabricated.
   If it is missing, ask the user for it, or mark it as to-be-filled. The renderer itself is
   also forbidden from generating images.

## Layout

```
SKILL.md                              # main flow: when to use / hard rules / 6 steps / 7 pitfalls
references/am-recipes.md              # am invocation, template choice, theme vars, audience toggle code, STE rules
references/grounding-checklist.md     # evidence checklist + pre-delivery verification checklist
scripts/clean-am-chrome.js            # strip reader-facing interaction buttons, produce the delivery copy
```

The "Pitfalls" section of `SKILL.md` records 7 mistakes actually hit in practice — for example,
`am patch` corrupts the page (use a full-page `am render --replace` instead); `callout` is a
fence, not a blockquote (getting it wrong passes STE silently and is only visible by opening the
page); and content inside the `html` escape hatch gets no `am` styling (wrap the container in an
`am-md` class).
