# Airtable → GitHub Pages 自动同步

第一阶段保留现有 GitHub Pages 架构。公开网站仍然只读取仓库里的 `data/cases.json` 和 `assets/cases/`，不会把 Airtable Token 放进前端。

## 已经接入的链路

```text
Airtable Cases & Capabilities
        ↓
Airtable Automation / GitHub Actions 手动运行
        ↓
scripts/sync-airtable.mjs
        ↓
更新 data/cases.json + 下载 Hero / Gallery 图片
        ↓
提交 main
        ↓
GitHub Pages 自动部署
```

同步只读取 `Public Level = P2` 且 `Asset Type = Case` 的记录。当前为 44 条，后续新增的 P2 Case 会自动纳入；案例顺序优先沿用当前 `cases.json` 的顺序，新记录追加到末尾；Airtable 记录排序变化不会打乱官网的案例分页。

## 第一次配置

### 1. 添加 GitHub Secret

在 GitHub 仓库 `luxshoostudio/matchstudio-site` 中打开：

`Settings → Secrets and variables → Actions → New repository secret`

创建：

| Name | Value |
|---|---|
| `AIRTABLE_TOKEN` | 只读 Airtable Personal Access Token（至少 `data.records:read`） |

Token 只需要读取这个 Base 的记录和附件，不要写入代码、Airtable 字段或公开网页。

### 2. 先手动测试

打开：

`Actions → Sync Airtable cases → Run workflow`

成功后，Actions 会在 `main` 产生一个同步提交；随后 GitHub Pages 会自动发布。通常从同步完成到网站显示需要约 1–5 分钟。

### 3. 配置 Airtable Automation 触发即时同步

在 Base `Match Studio｜Business OS` 中新建 Automation。建议先在 `Cases & Capabilities` 建一个视图 `Website P2 Sync`，过滤条件为 `Public Level is P2` 和 `Asset Type is Case`，然后配置：

- Trigger：`When record updated`
- Table：`Cases & Capabilities`
- View：`Website P2 Sync`
- Watched fields：选择 `All fields`，或至少选择 `Hero Image`、`Case Gallery`、标题、Intro、Approach、Client、Industry、Services、Year、Country、City 和 Public Level
- Action：`Run a script`

在 Run a script 右侧的 Variables 面板中选择 `Add secret`，创建密钥名 `githubToken`，值填 GitHub Fine-grained PAT。这个 Token 应只对当前仓库有权限，至少允许该仓库的 `Contents: Read and write`；不要把 Token 写入脚本正文。GitHub 的 `repository_dispatch` 接口使用这个权限触发自定义事件。Airtable 的 Secret 会被隐藏并自动从执行日志中脱敏。

脚本内容：

```js
const githubToken = input.secret('githubToken');

const response = await fetch(
  'https://api.github.com/repos/luxshoostudio/matchstudio-site/dispatches',
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ event_type: 'airtable_sync' }),
  },
);

if (!response.ok) {
  throw new Error(`GitHub dispatch failed: ${response.status}`);
}

output.set('status', 'GitHub Actions sync dispatched');
```

先用 Test action，再开启 Automation。之后修改符合条件的案例记录（尤其是 Hero Image）会触发同步。当前已取消定时轮询，避免没有内容变化时重复产生失败通知；如果需要补跑，可以在 GitHub Actions 中手动运行 `Sync Airtable cases`。

## 图片与视频边界

- Hero Image 与 Case Gallery 会被下载进仓库，避免 Airtable 附件临时 URL 过期后断链。
- 同步脚本会在写入前验证图片格式和下载结果；失败时不会提交新的 `cases.json`。
- 英文标题、英文 Intro 和英文 Approach 会保留当前官网快照，因为 Airtable 当前结构没有对应英文正文列。
- Case Videos 第一阶段继续保留现有快照中的视频字段。Airtable 视频附件 URL 也会过期，下一阶段应接入 Cloudflare R2、S3 或其他永久对象存储，再把视频同步改为稳定 URL；不建议直接把大量 MP4 提交进普通 Git 仓库。

## 本地检查

需要 Node.js 20 或更高版本：

```bash
AIRTABLE_TOKEN='只在本地终端临时设置' node scripts/sync-airtable.mjs --dry-run
```

本地正式同步会下载并替换 `assets/cases/` 与 `data/cases.json`，因此建议先确认工作区干净，并不要把 Token 放进 `.env` 后提交。
