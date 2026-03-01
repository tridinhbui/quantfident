# Collaborator Setup Guide

Welcome to the QuantFident project! This guide helps you set up your local development environment.

## Prerequisites

- Node.js 20+ (LTS recommended)
- Git
- GitHub account with access to this repository
- Text editor (VS Code recommended)

---

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/tridinhbui/quantfident.git
cd quantfident
```

**Or using GitHub CLI:**
```bash
gh repo clone tridinhbui/quantfident
cd quantfident
```

### 2. Install Dependencies

```bash
npm install
```

This installs all required packages (~597 packages, takes 1-2 minutes).

### 3. Set Up Environment Variables

Create a `.env.local` file in the project root:

```bash
touch .env.local
```

Add the following (replace with YOUR OWN credentials):

```bash
# FIREBASE AUTHENTICATION
# Get from: https://console.firebase.google.com → Your Project → Settings
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project",...}

# SUPABASE DATABASE
# Get from: https://supabase.com → Your Project → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# APPLICATION CONFIG
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_EMAIL=your.email@example.com
```

**⚠️ IMPORTANT**: 
- Use YOUR OWN test Firebase and Supabase projects
- Do NOT ask for production credentials
- These are for local development only

### 4. Set Up Your Test Database

#### Create Supabase Project
1. Go to https://supabase.com and sign up (free)
2. Create a new project:
   - Name: `quantfident-dev-yourname`
   - Database password: (set a strong password)
   - Region: (choose closest to you)
3. Wait 2 minutes for project to initialize

#### Get Credentials
1. Go to Project Settings → API
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

#### Initialize Database
Ask the project maintainer for the database schema SQL file, then:
1. Go to Supabase → SQL Editor
2. Paste the schema
3. Click "Run"
4. Verify tables are created in Database → Tables

### 5. Set Up Firebase (For Authentication)

#### Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click "Add project"
3. Name: `quantfident-dev-yourname`
4. Disable Google Analytics (optional for testing)
5. Click "Create project"

#### Enable Email Authentication
1. Go to Authentication → Sign-in method
2. Click "Email/Password"
3. Enable **Email link (passwordless sign-in)**
4. Click "Save"

#### Get Credentials
1. Go to Project Settings (⚙️ icon)
2. Scroll to "Your apps" → Web app (</> icon)
3. Register app: `quantfident-dev`
4. Copy all the config values to your `.env.local`

#### Get Service Account Key
1. Still in Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download JSON file
4. Copy entire JSON content to `FIREBASE_SERVICE_ACCOUNT_KEY` in `.env.local`
   - Keep it as one line: `FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}`

### 6. Run Development Server

```bash
npm run dev
```

Visit: **http://localhost:3000**

You should see the QuantFident homepage!

---

## 👨‍💻 Development Workflow

### Branching Strategy

**Always create a feature branch:**
```bash
# Update main branch first
git checkout main
git pull origin main

# Create your feature branch
git checkout -b feature/your-feature-name
# Or: git checkout -b fix/bug-description
```

### Commit Convention

Use conventional commits:
```bash
feat: add new blog post feature
fix: resolve authentication bug
docs: update README
style: format code with prettier
refactor: restructure blog service
test: add unit tests for auth
chore: update dependencies
```

**Examples:**
```bash
git commit -m "feat: add like button to blog posts"
git commit -m "fix: resolve issue with avatar upload"
git commit -m "docs: add API documentation"
```

### Push Your Changes

```bash
git add .
git commit -m "feat: your description"
git push origin feature/your-feature-name
```

### Open a Pull Request

1. Go to https://github.com/tridinhbui/quantfident/pulls
2. Click **"New pull request"**
3. Select your branch
4. Fill in:
   - **Title**: Clear description of changes
   - **Description**: What changed and why
   - **Screenshots**: If UI changes
5. Click **"Create pull request"**
6. Wait for code review

### After Approval

Once approved, the maintainer will merge your PR. Then:
```bash
git checkout main
git pull origin main
git branch -d feature/your-feature-name  # Delete local branch
```

---

## 📁 Project Structure

```
quantfident/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Homepage
│   │   ├── api/               # API routes
│   │   ├── blog/              # Blog pages
│   │   └── admin/             # Admin dashboard
│   ├── components/            # React components
│   │   ├── ui/                # Shadcn UI components
│   │   ├── sections/          # Page sections
│   │   ├── auth/              # Auth components
│   │   └── blog/              # Blog components
│   ├── lib/                   # Utilities and services
│   │   ├── auth/              # Authentication logic
│   │   ├── services/          # API services
│   │   └── firebase/          # Firebase config
│   └── types/                 # TypeScript types
├── public/                    # Static assets
├── prisma/                    # Prisma schema
├── docs/
│   └── public/                # Public documentation (you can read)
└── [config files]
```

**Note**: You may see references to `docs/private/` in `.gitignore`. These are internal implementation guides that aren't required for development. All necessary docs are in `docs/public/`.

---

## 🧪 Testing Your Changes

### Manual Testing
```bash
# Run dev server
npm run dev

# Test in browser
open http://localhost:3000
```

### Check for Errors
```bash
# Type checking
npm run build

# Linting
npx eslint src/

# Format code
npx prettier --write .
```

---

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### Database Connection Error
- Verify `DATABASE_URL` or Supabase credentials in `.env.local`
- Check Supabase project is running (not paused)
- Ensure tables exist in database

### Firebase Auth Error
- Verify all `NEXT_PUBLIC_FIREBASE_*` variables are set
- Check Firebase console for authentication is enabled
- Ensure service account key JSON is valid

### Module Not Found
```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors
```bash
# Restart TypeScript server in VS Code
# Command Palette → "TypeScript: Restart TS Server"

# Or rebuild
rm -rf .next
npm run build
```

---

## 🚫 What NOT to Do

### Security - NEVER Commit:
- ❌ `.env.local` file
- ❌ `.env.production` or any `.env.*` files
- ❌ Firebase service account JSON files
- ❌ Supabase service role keys
- ❌ Any passwords or API keys

### Git - NEVER Push:
- ❌ Directly to `main` branch (use feature branches)
- ❌ Without testing locally first
- ❌ Large binary files (images > 1MB, use Supabase Storage)

### Code - NEVER:
- ❌ Remove existing functionality without discussion
- ❌ Change configuration files without documenting why
- ❌ Merge your own PRs (wait for review)

---

## ✅ Best Practices

### Before Starting Work:
1. ✓ Pull latest changes: `git pull origin main`
2. ✓ Create feature branch
3. ✓ Ensure dev server runs: `npm run dev`

### While Coding:
1. ✓ Commit frequently with clear messages
2. ✓ Test your changes locally
3. ✓ Follow existing code style
4. ✓ Add comments for complex logic

### Before Pushing:
1. ✓ Run `npm run build` (no errors)
2. ✓ Test all affected features
3. ✓ Format code: `npx prettier --write .`
4. ✓ Commit: clear, descriptive message

### Pull Request:
1. ✓ Write clear description
2. ✓ Add screenshots for UI changes
3. ✓ Reference related issues: "Fixes #123"
4. ✓ Respond to review comments

---

## 📚 Useful Commands

### Development
```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Git
```bash
git status           # Check current changes
git log --oneline    # View commit history
git diff             # See what changed
git stash            # Temporarily save changes
git stash pop        # Restore stashed changes
```

### Database (if using Prisma)
```bash
npx prisma studio    # Open database GUI
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema to database
```

---

## 🆘 Getting Help

### Documentation
- Check `docs/public/` for guides
- Read `README.md` in project root
- Review existing code for patterns

### Ask Questions
- Open an issue on GitHub for bugs
- Comment on related PR for feature questions
- Ask maintainer for clarification via email

### Resources
- Next.js: https://nextjs.org/docs
- React: https://react.dev
- TypeScript: https://www.typescriptlang.org/docs
- Supabase: https://supabase.com/docs
- Firebase: https://firebase.google.com/docs

---

## 🎯 Your First Contribution

Ready to make your first contribution? Try these beginner-friendly tasks:

1. **Fix a typo** in documentation
2. **Improve error messages** in existing code
3. **Add comments** to complex functions
4. **Update README** with clearer instructions
5. **Create a component** for a simple UI element

**Then**, once comfortable:
- Work on "good first issue" labeled issues
- Implement new features
- Improve existing features
- Write tests

---

## 🎉 Welcome Aboard!

Thank you for contributing to QuantFident! Your work helps make financial education more accessible.

**Questions?** Don't hesitate to ask - we're here to help!

**Happy Coding!** 🚀
