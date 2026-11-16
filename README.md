# La Casa Properties

Next.js, TypeScript, Tailwind CSS, and Supabase property ERP.

## Setup

1. Create a Supabase project and run `supabase/migrations/001_private_schema.sql`, then `002_database_roles.sql`.
2. Configure `.env.local` with:

```env
NEXT_SUPABASE_URL=https://your-project.supabase.co
NEXT_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SECRET_KEY=your-server-only-secret-key
SUPABASE_STORAGE_BUCKET=property
```

3. Create users through Supabase Auth or the admin screen. Assign the first admin by a trusted SQL operation, for example `update public.profiles set role = 'admin' where email = 'admin@example.com';`.

Authentication uses Supabase Auth passwords and the database role in `public.profiles`. There are no `ADMIN_EMAIL` or `ADMIN_PASSWORD` settings. The secret key is server-only.

## Run

```bash
npm install
npm run dev
npm run build
```
