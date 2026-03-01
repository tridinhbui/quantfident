# 🔒 Access Control - Quick Reference

## Current Status
✅ **Setup Complete** - Your repository access control is configured

---

## 📊 What You Have Now

### Files Created
1. **`docs/public/ACCESS_CONTROL.md`** - Complete access control guide (comprehensive)
2. **`docs/public/COLLABORATOR_SETUP.md`** - Setup guide for new developers
3. **`.devcontainer/devcontainer.json`** - GitHub Codespaces configuration
4. **`scripts/setup-access-control.sh`** - Automated setup script

### Protected Files
- ✅ `docs/private/` - Implementation guides (NOT in git)
- ✅ `.env.local` - Environment variables (NOT in git)
- ✅ `database-schema.sql` - Database schema (NOT in git)
- ✅ All sensitive credentials (gitignored)

---

## ⚡ Quick Actions

### 1. Make Repository Private (REQUIRED)

**Option A: Web Interface (Easiest)**
```
1. Go to: https://github.com/tridinhbui/quantfident/settings
2. Scroll to "Danger Zone" → "Change repository visibility"
3. Select "Make private" → Confirm
```

**Option B: Command Line**
```bash
gh repo edit tridinhbui/quantfident --visibility private
```

**Option C: Run Automated Script**
```bash
./scripts/setup-access-control.sh
```

---

### 2. Add a Collaborator

**Quick Command:**
```bash
# Write access (can push code)
gh api repos/tridinhbui/quantfident/collaborators/USERNAME \
  --method PUT --field permission=push

# Read access (view only)
gh api repos/tridinhbui/quantfident/collaborators/USERNAME \
  --method PUT --field permission=pull
```

**Or via Web:**
```
https://github.com/tridinhbui/quantfident/settings/access
→ Click "Add people"
```

---

### 3. Share Setup Guide with New Collaborators

Send them:
```
Hi! You've been added to the QuantFident repository.

Please follow this setup guide:
https://github.com/tridinhbui/quantfident/blob/main/docs/public/COLLABORATOR_SETUP.md

IMPORTANT: Use your OWN Firebase and Supabase projects for testing.
Do NOT ask for production credentials.

Let me know if you have questions!
```

---

### 4. Enable Branch Protection

**Quick Command:**
```bash
gh api repos/tridinhbui/quantfident/branches/main/protection \
  --method PUT \
  --field required_pull_request_reviews='{"required_approving_review_count":1}'
```

**Or via Web:**
```
https://github.com/tridinhbui/quantfident/settings/branches
→ Add rule for "main" branch
→ Require pull request reviews
```

---

## 🎯 What Collaborators Will Get

### ✅ WILL Get
- Source code (src/)
- Public documentation (docs/public/)
- Configuration files
- Package dependencies list
- Prisma schema (structure only)

### ❌ Will NOT Get
- docs/private/ (your implementation guides)
- .env.local (your credentials)
- database-schema.sql (your database)
- Any production secrets

---

## 🔍 Verify Security

```bash
# Run quick security check
cd /workspaces/quantfident

# 1. Check private docs are ignored
git check-ignore docs/private/COMPLETE_IMPLEMENTATION_GUIDE.md
# Should output: .gitignore:44:docs/private/...

# 2. Check nothing sensitive is tracked
git ls-files | grep -E "(private|env|secret)"
# Should return nothing (or only .gitignore references)

# 3. See what will be public
git ls-tree -r HEAD --name-only | sort
# Should NOT include docs/private/ or .env files

# 4. Current git status
git status
# docs/private/ should NOT appear in untracked files
```

---

## 📋 Pre-Flight Checklist

Before inviting collaborators, ensure:

- [ ] Repository is PRIVATE (https://github.com/tridinhbui/quantfident/settings)
- [ ] `docs/private/` is in .gitignore
- [ ] `.env.local` is in .gitignore
- [ ] No sensitive files in git history: `git log --all --source | grep -i "env"`
- [ ] Branch protection enabled on `main`
- [ ] Collaborator setup guide is ready: `docs/public/COLLABORATOR_SETUP.md`
- [ ] Test cloning repo in incognito/another account (should be blocked if private)

---

## 🚨 Emergency: Remove Accidentally Committed Secrets

If you accidentally committed `.env.local` or secrets:

```bash
# 1. Remove file from git (keeps local copy)
git rm --cached .env.local
git commit -m "chore: remove accidentally committed secrets"

# 2. Remove from git history (use with caution)
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .env.local' \
  --prune-empty --tag-name-filter cat -- --all

# 3. Force push (WARNING: rewrites history)
git push origin --force --all
git push origin --force --tags

# 4. Rotate all exposed credentials immediately!
# - Generate new Firebase keys
# - Generate new Supabase keys
# - Update .env.local with new values
```

**Better approach:** Use BFG Repo-Cleaner (safer):
```bash
# Install: brew install bfg
bfg --delete-files .env.local
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push origin --force --all
```

---

## 📞 Quick Links

| Action | URL |
|--------|-----|
| **Repository Settings** | https://github.com/tridinhbui/quantfident/settings |
| **Collaborators & Teams** | https://github.com/tridinhbui/quantfident/settings/access |
| **Branch Protection** | https://github.com/tridinhbui/quantfident/settings/branches |
| **Secrets Management** | https://github.com/tridinhbui/quantfident/settings/secrets/codespaces |
| **View Repository** | https://github.com/tridinhbui/quantfident |

---

## 🎓 Access Levels Explained

| Level | Can Do | Use For |
|-------|--------|---------|
| **Read** | View, clone, comment | Code reviewers, observers |
| **Write** | Push, merge PRs, label issues | Active developers |
| **Admin** | All settings, add collaborators | You, trusted co-maintainers |

**Recommendation**: Start with **Write** for developers, upgrade only if needed.

---

## 💡 Pro Tips

1. **Never share production credentials** - Collaborators use their own test projects
2. **Review PRs before merging** - Enable branch protection to enforce this
3. **Use Codespaces secrets** - For shared development environments
4. **Audit access quarterly** - Remove inactive collaborators
5. **Use .env.example** - Create template without actual values:
   ```bash
   cp .env.local .env.example
   # Replace all values with placeholders
   git add .env.example
   ```

---

## ✅ You're All Set!

Your repository is configured for secure collaboration. Next steps:

1. **Run the setup script**: `./scripts/setup-access-control.sh`
2. **Verify repository is private** at GitHub settings
3. **Add collaborators** as needed
4. **Share COLLABORATOR_SETUP.md** with them

**Questions?** See full guide: [docs/public/ACCESS_CONTROL.md](ACCESS_CONTROL.md)
