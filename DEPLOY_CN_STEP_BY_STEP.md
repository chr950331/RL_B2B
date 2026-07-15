# 云端部署步骤

## 1. 准备 Supabase

1. 打开 Supabase 项目。
2. 进入 SQL Editor。
3. 执行 `supabase/schema.sql` 里的全部 SQL。
4. 确认生成了这些表：
   - `buyers`
   - `auctions`
   - `bids`
   - `allocations`

## 2. 上传代码到 GitHub

在项目根目录 `D:\RL_B2B` 打开终端：

```bash
git init
git add .
git commit -m "initial rl b2b app"
```

然后在 GitHub 新建一个仓库，把本地代码 push 上去。

如果你不熟 GitHub，也可以在 Vercel 里用手动导入压缩包，但推荐 GitHub。

## 3. Vercel 导入项目

1. 打开 Vercel。
2. 点击 Add New Project。
3. 选择刚刚的 GitHub 仓库。
4. Framework Preset 选择 Next.js。
5. Build Command 保持默认：

```bash
npm run build
```

6. Output Directory 保持默认，不要改。

## 4. 添加环境变量

在 Vercel 项目的 Environment Variables 里添加：

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
APP_SECRET
```

注意：

- `NEXT_PUBLIC_SUPABASE_URL` 和 `SUPABASE_URL` 填一样的 Supabase Project URL。
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` 和 `SUPABASE_ANON_KEY` 填一样的 anon key。
- `SUPABASE_SERVICE_ROLE_KEY` 填 service role key，不要加 `NEXT_PUBLIC_`。
- `APP_SECRET` 填你本地 `.env.local` 里的同一个随机字符串。
- 云端 Vercel 不需要填写 `PY_API_URL`。

## 5. 部署

点击 Deploy。

部署成功后打开：

```text
https://你的项目.vercel.app/login
```

第一个注册的账号会自动成为管理员。

## 6. 中国用户访问建议

- 绑定公司自己的域名，比如 `b2b.yourcompany.com`。
- 不要长期给客户使用随机的 `vercel.app` 域名。
- 当前是用户名密码登录，不依赖邮件，适合中国用户。
- 如果后续访问速度要求更高，可以把前端和 Python API 部署到香港或新加坡服务器。

## 7. 常见问题

如果注册时报 404，说明 `/api/*` 没有走到 Python 后端。当前项目已经在 `vercel.json` 里配置：

```json
{
  "src": "/api/(.*)",
  "dest": "/api/index.py"
}
```

如果注册时报缺少环境变量，检查 Vercel 环境变量是否已添加，并重新部署。
