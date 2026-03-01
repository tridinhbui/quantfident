# Repository Access Control Guide

## 🔒 Current Status
- **Repository**: `tridinhbui/quantfident`
- **Current Visibility**: PUBLIC ⚠️
- **Private Docs Protection**: ✅ Active (gitignored in `docs/private/`)

---

## 🛡️ Step 1: Make Repository Private

### Option A: GitHub Web Interface (Recommended)
1. Go to: https://github.com/tridinhbui/quantfident/settings
2. Scroll to **Danger Zone** at the bottom
3. Click **"Change repository visibility"**
4. Select **"Make private"**
5. Type repository name to confirm: `tridinhbui/quantfident`
6. Click **"I understand, change repository visibility"**

### Option B: GitHub CLI
```bash
gh repo edit tridinhbui/quantfident --visibility private
```

**After making private:**
- ✅ Only you can see the repository
- ✅ No one can clone without permission
- ✅ All Codespaces require authentication
- ✅ Existing forks (like Hienology/quantfident) remain separate

---

## 👥 Step 2: Add Collaborators (Controlled Access)

### GitHub Web Interface
1. Go to: https://github.com/tridinhbui/quantfident/settings/access
2. Click **"Invite a collaborator"**
3. Enter GitHub username or email
4. Choose permission level:
   - **Read**: Can only view and clone (not recommended for development)
   - **Write**: Can push to repo, create branches (recommended for collaborators)
   - **Admin**: Full control including settings (for trusted partners only)

### GitHub CLI
```bash
# Add collaborator with Write access
gh api repos/tridinhbui/quantfident/collaborators/USERNAME \
  --method PUT \
  --field permission=push

# Add with Read access only
gh api repos/tridinhbui/quantfident/collaborators/USERNAME \
  --method PUT \
  --field permission=pull
```

### Recommended Access Levels

| Role | Permission | Can Do | Cannot Do |
|------|-----------|---------|-----------|
| **Developer** | Write | Clone, push, create branches, open PRs | Change settings, add collaborators, see private docs |
| **Reviewer** | Read | View code, download, comment on issues | Push code, modify repo |
| **You (Owner)** | Admin | Everything | N/A |

---

## 🚫 Step 3: What Collaborators Will NOT Get

When someone clones your repo, they **will NOT** receive:

### Automatically Excluded (via .gitignore)
```
✗ docs/private/                          # All implementation guides
  ✗ READING_FLOW_GUIDE.md
  ✗ SUPABASE_INTEGRATION_PLAN.md
  ✗ SUPABASE_QUICK_GUIDE.md
  ✗ SUPABASE_WITH_PRISMA_EXPLAINED.md
  ✗ COMPLETE_IMPLEMENTATION_GUIDE.md
✗ .env.local                             # Your environment variables
✗ .env*.local                            # Any local env files
✗ database-schema.sql                    # Your database schema
✗ node_modules/                          # Dependencies (they reinstall)
✗ .next/                                 # Build artifacts
```

### What They WILL Get
```
✓ src/                                   # Source code
✓ public/                                # Public assets
✓ docs/public/                           # Public documentation
✓ package.json                           # Dependencies list
✓ README.md                              # Project overview
✓ prisma/schema.prisma                   # Database schema (structure only)
✓ All configuration files                # next.config.ts, tsconfig.json, etc.
```

**Key Point**: Implementation guides stay with you only! 🔐

---

## 🖥️ Step 4: GitHub Codespaces Access Control

### Configure Codespace Permissions

Create `.devcontainer/devcontainer.json` to control Codespace setup:

```json
{
  "name": "QuantFident Development",
  "image": "mcr.microsoft.com/devcontainers/typescript-node:1-20-bullseye",
  
  "features": {
    "ghcr.io/devcontainers/features/node:1": {
      "version": "20"
    },
    "ghcr.io/devcontainers/features/github-cli:1": {}
  },
  
  "postCreateCommand": "npm install",
  
  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "prisma.prisma"
      ],
      "settings": {
        "editor.formatOnSave": true,
        "editor.defaultFormatter": "esbenp.prettier-vscode"
      }
    }
  },
  
  "remoteUser": "node",
  
  // Environment (collaborators need to set their own)
  "remoteEnv": {
    "ADMIN_EMAIL": "${localEnv:ADMIN_EMAIL}",
    "NEXT_PUBLIC_SITE_URL": "https://${CODESPACE_NAME}-3000.app.github.dev"
  }
}
```

### Codespace Secrets (For Collaborators)

**You set these in GitHub Settings:**
1. Go to: https://github.com/tridinhbui/quantfident/settings/secrets/codespaces
2. Click **"New repository secret"**
3. Add (only non-sensitive collaborator needs):
   - `ADMIN_EMAIL` → (each collaborator sets their test email)
   - Other secrets they provide themselves

**Collaborators must add their own:**
- Firebase credentials (from their Firebase project)
- Supabase credentials (from their Supabase project)  
- They CANNOT access your production secrets

---

## 📋 Step 5: Branch Protection Rules

### Protect Main Branch
1. Go to: https://github.com/tridinhbui/quantfident/settings/branches
2. Click **"Add rule"**
3. Branch name pattern: `main`
4. Enable:
   - ☑ **Require a pull request before merging**
   - ☑ **Require approvals** (1 approval)
   - ☑ **Dismiss stale pull request approvals when new commits are pushed**
   - ☑ **Require status checks to pass before merging**
   - ☑ **Require conversation resolution before merging**
   - ☐ **Do not allow bypassing the above settings** (optional - allows you to force push)

### Alternative: GitHub CLI
```bash
gh api repos/tridinhbui/quantfident/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":[]}' \
  --field enforce_admins=false \
  --field required_pull_request_reviews='{"required_approving_review_count":1}' \
  --field restrictions=null
```

**This ensures:**
- ✅ No direct pushes to main (all via PR)
- ✅ Code review required before merge
- ✅ You maintain quality control

---

## 📖 Step 6: Create Collaborator Onboarding Guide

Create `docs/public/COLLABORATOR_SETUP.md` (public file for new developers):

```markdown
# Collaborator Setup Guide

Welcome to the QuantFident project! This guide helps you set up your local development environment.

## Prerequisites
- Node.js 20+
- Git
- GitHub account with access to this repository

## Setup Steps

### 1. Clone Repository
\`\`\`bash
git clone https://github.com/tridinhbui/quantfident.git
cd quantfident
\`\`\`

### 2. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Set Up Environment Variables

Create `.env.local` in the project root:

\`\`\`bash
# FIREBASE AUTHENTICATION (Get from your Firebase project)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# SUPABASE DATABASE (Get from your Supabase project)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# APPLICATION CONFIG
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_EMAIL=your.email@example.com
\`\`\`

**Important**: Use YOUR OWN Firebase and Supabase projects for testing. Do NOT ask for production credentials.

### 4. Set Up Your Test Database

1. Create a Supabase account at https://supabase.com
2. Create a new project (free tier)
3. Run database migrations (ask maintainer for schema file)

### 5. Run Development Server
\`\`\`bash
npm run dev
\`\`\`

Visit: http://localhost:3000

## Development Workflow

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make changes and commit: `git commit -m "feat: description"`
3. Push to your branch: `git push origin feature/your-feature-name`
4. Open a Pull Request on GitHub
5. Wait for code review and approval
6. Merge after approval

## What You Don't Need

You may notice `.gitignore` references to `docs/private/` - these are internal implementation guides that are NOT required for development. All necessary documentation is in `docs/public/`.

## Getting Help

- Check `docs/public/` for public documentation
- Open an issue for questions
- Ask maintainer for clarification

## Security Guidelines

- ⛔ **NEVER** commit `.env.local` or any credentials
- ⛔ **NEVER** share your Firebase/Supabase keys
- ⛔ **NEVER** commit sensitive configuration
- ✅ **ALWAYS** use your own test projects for development
- ✅ **ALWAYS** open a PR for changes (no direct commits to main)

Happy coding! 🚀
\`\`\`

---

## 🔐 Step 7: Security Audit Checklist

Before inviting collaborators, verify:

```bash
# 1. Check what files are tracked in git
git ls-files | grep -E "(env|private|secret|key|password)" 
# Should return NOTHING or only .gitignore entries

# 2. Check what will be public if repo goes public
git ls-tree -r HEAD --name-only | sort
# Should NOT include docs/private/ files

# 3. Verify .gitignore is working
git check-ignore docs/private/COMPLETE_IMPLEMENTATION_GUIDE.md
# Should output: .gitignore:44:docs/private/ ...

# 4. Check for sensitive data in git history
git log --all --full-history --source --find-object=$(git hash-object .env.local 2>/dev/null | head -c 7) 2>/dev/null || echo "✓ No .env in history"

# 5. Verify environment file is local only
ls -la | grep "\.env"
# Should show .env.local (local only, not tracked)
```

**Expected Results:**
- ✅ No credentials in git history
- ✅ docs/private/ not tracked
- ✅ .env.local not tracked
- ✅ Only safe files will be shared with collaborators

---

## 📱 Step 8: Quick Commands Reference

### Make Repo Private
```bash
gh repo edit tridinhbui/quantfident --visibility private
```

### Add Collaborator (Write Access)
```bash
gh api repos/tridinhbui/quantfident/collaborators/USERNAME \
  --method PUT --field permission=push
```

### Remove Collaborator
```bash
gh api repos/tridinhbui/quantfident/collaborators/USERNAME \
  --method DELETE
```

### List Current Collaborators
```bash
gh api repos/tridinhbui/quantfident/collaborators | jq '.[].login'
```

### Check Who Has Access
```bash
gh repo view tridinhbui/quantfident --json collaborators
```

---

## ✅ Final Verification

After completing all steps:

1. **Repository is private**: https://github.com/tridinhbui/quantfident should show 🔒 Private
2. **Collaborators added**: Listed in Settings → Collaborators
3. **Branch protection enabled**: Settings → Branches shows rule for `main`
4. **Private docs protected**: `git status` never shows `docs/private/`
5. **Public docs ready**: `docs/public/COLLABORATOR_SETUP.md` exists
6. **Codespace configured**: `.devcontainer/devcontainer.json` exists

---

## 🎯 Summary: Who Can See What

| Item | You (Owner) | Collaborators | Public |
|------|-------------|---------------|--------|
| Source code | ✅ | ✅ | ❌ (private repo) |
| docs/public/ | ✅ | ✅ | ❌ (private repo) |
| docs/private/ | ✅ | ❌ | ❌ |
| .env.local | ✅ | ❌ | ❌ |
| Production DB | ✅ | ❌ | ❌ |
| Commit history | ✅ | ✅ | ❌ (private repo) |
| Issues/PRs | ✅ | ✅ (if Write access) | ❌ |

**Your implementation details stay private!** 🔒

---

## 📞 Need Help?

- **Make repo private**: Settings → Danger Zone → Change visibility
- **Add collaborators**: Settings → Collaborators → Add people
- **Branch protection**: Settings → Branches → Add rule
- **View access**: `gh repo view --json collaborators`

**Repository**: https://github.com/tridinhbui/quantfident/settings
