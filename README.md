# RL B2B Username Bidding MVP

Internal B2B inventory allocation platform. Buyers submit a premium percentage and requested quantity. Inventory allocation is sorted by highest premium first, then earliest update time.

## Features

- Username/password registration and login
- First registered user automatically becomes admin
- Later registered users become buyers
- Admin can create users, create/open/close auctions, allocate inventory, and export CSV
- Buyers can view active auctions, submit or edit their own bid
- Leaderboard shows username to everyone
- Supabase Realtime refreshes the auction page after bid changes
- Python FastAPI backend
- Supabase PostgreSQL database

## Local Setup

1. Install dependencies.

```bash
npm install
```

2. Create `.env.local`.

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:your-password@db.your-project-ref.supabase.co:5432/postgres

# Recommended for production token signing.
APP_SECRET=replace-with-a-long-random-secret
```

3. Run [supabase/schema.sql](./supabase/schema.sql) in Supabase SQL Editor.

4. Start the app.

```bash
npm run dev
```

Open `http://localhost:3000/login`.

## First Admin

The first account registered on `/login` becomes `admin`. Every later self-registered account becomes `buyer`.

If you need to promote another user manually:

```sql
update public.buyers
set role = 'admin'
where username = 'your_username';
```

## Deployment

Deploy on Vercel with these environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
APP_SECRET
```

Use a custom domain for China-based users, for example `https://b2b.yourcompany.com`. Username/password login avoids email delivery problems in China.

## Production Checklist

- Set a long random `APP_SECRET`.
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` as a `NEXT_PUBLIC_` variable.
- Register the admin account first.
- Test with two buyer accounts and confirm the leaderboard shows usernames.
- Test allocation and CSV export from `/admin`.
