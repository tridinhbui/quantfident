## QuantFident Mentorship — Think Smart. Be QuantFident

One-click deployable marketing site for the mentorship program. Built with Next.js App Router, TypeScript, Tailwind CSS v4, shadcn/ui, Lucide, Framer Motion. SEO-ready with Open Graph image, sitemap, robots, per-route metadata. Includes `/api/apply` with zod validation saving submissions to `/tmp/applications.json` (and logging to console).

### Stack
- Next.js 14+ (App Router), Edge runtime for static routes
- TypeScript, ESLint/Prettier
- Tailwind CSS v4 (class dark mode)
- shadcn/ui components (Button, Card, Badge, Accordion, Input, Textarea, Dialog, Sheet, Label, Sonner)
- Lucide icons, Framer Motion animations
- Vercel Analytics + Speed Insights

### Develop
```bash
pnpm i
pnpm approve-builds # allow optional deps if prompted
pnpm dev
```
Dev server: `http://localhost:3000`

### Environment
- `NEXT_PUBLIC_SITE_URL` (optional): canonical URL, used in metadata/sitemap/robots
- `ADMIN_EMAIL` (server-only): the *only* account that can be promoted to admin role.
- `NEXT_PUBLIC_CONTACT_EMAIL` (client-visible): public contact mailbox shown in CTA. This is intentionally separate from `ADMIN_EMAIL`.
- `NEXT_PUBLIC_SUPABASE_URL` (client/server): Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (client): public anonymous key for read/write.
- `SUPABASE_SERVICE_ROLE_KEY` (server-only): privileged key for server-side operations.

### Deploy (Vercel)
1. Push to GitHub
2. Import to Vercel and set `NEXT_PUBLIC_SITE_URL`
3. Deploy. Analytics/Speed Insights work automatically

### Routes
- `/` Landing
- `/program` Program content
- `/mentor` Mentor profile
- `/tracks` Schedules/tracks
- `/pricing` Pricing + FAQ
- `/apply` Application form (+ `/apply/thank-you`)
- `/privacy`, `/terms`

### API
- `POST /api/apply` accepts JSON body with fields: name, email, contact, school, cv, github, goal, experience, availability, question
- Validates via zod; appends to `/tmp/applications.json`; logs to server console

<!-- redeploy: trigger build -->

### Notes
- Images use `next/image` when added
- Animations are lazy-in-view
- Dark mode toggled via header button (class strategy)
