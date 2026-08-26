# AI Concierge backend

前端固定请求：`https://api.matchstudio.cn/esse`

## Vercel 配置

1. 在 Vercel 创建或关联一个项目，根目录指向本仓库。`api/esse.js` 是 Node.js Serverless Function，`vercel.json` 将 `/esse` 重写到它。
2. 在 Vercel Production 环境添加以下变量，不要写进 Git：
   - `OPENAI_API_KEY`：OpenAI API key。
   - `OPENAI_MODEL`：可用的模型 ID，默认 `gpt-5`；如果账号不可用，改成账号可用的模型。
   - `RESEND_API_KEY`：Resend API key。
   - `RESEND_FROM_EMAIL`：Resend 已验证的发件地址，例如 `Match Studio <hello@matchstudio.cn>`。
   - `CONCIERGE_TO_EMAIL`：默认是 `Luxshoo.studio@gmail.com`。
   - `ALLOWED_ORIGINS`：`https://matchstudio.cn,https://www.matchstudio.cn`。
3. 在 Vercel 项目添加自定义域名 `api.matchstudio.cn`。DNS 中按 Vercel 控制台显示的目标添加 `api` 的 CNAME，不要自行猜目标值。
4. 给 `matchstudio.cn` 在 Resend 完成域名验证，并确认 `RESEND_FROM_EMAIL` 使用已验证的发件地址。收件箱可以是 Gmail，但不需要把 Gmail 密码交给网站。
5. 部署后先检查：

   ```text
   OPTIONS https://api.matchstudio.cn/esse
   POST    https://api.matchstudio.cn/esse
   ```

   前端生产域名应能正常得到 JSON 回复；未配置密钥时应返回明确的配置错误，而不是把密钥暴露到浏览器。

## 行为边界

- 普通 AI 对话只调用 Agent，不发邮件。
- 三项简报提交会调用 Agent，并向 `CONCIERGE_TO_EMAIL` 发一封邮件。
- OpenAI 和 Resend 的密钥只存在 Vercel 环境变量中。
- 正式公开前建议增加速率限制、机器人校验和日志告警，避免接口被滥用。
