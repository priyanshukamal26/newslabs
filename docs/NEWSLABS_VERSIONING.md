# 🛠️ NewsLabs Versioning & Restore Guide

## Current Project State

- **Project**: NewsLabs
- **Current Stable Release**: v3.3.1
- **Hosting**: Vercel (Frontend) + Render (Backend)
- **Database**: Supabase (PostgreSQL)
- **GitHub Production Branch**: `main`
- **Development Phase**: Transitioning to v3.4 / v4.0

Version 3.3.1 is currently the stable baseline. A permanent restore point for the previous state has been created as `v3.0.0-legacy` on GitHub. Before pushing major architectural changes or new AI models, a new version tag should be created.

---

## 🛡️ Restore Strategy

Version 3.3.x is preserved using a multi-layered approach:

1.  **Git Tag**: A permanent, immutable snapshot of the code.
2.  **Backup Branch**: A secondary branch (`stable-v3.3`) for quick hotfixes without touching the development main.
3.  **Local Archive**: Manual backup of environment variables (`.env`).

This ensures the platform can be reverted instantly if a new deployment fails or introduces breaking changes.

---

## 🛰️ Step 1 — Create Version Tag for v3.3.0

Run these commands in the project root:

```bash
git checkout main
git pull origin main
git tag -a v3.3-stable -m "NewsLabs stable production release v3.3.0"
git push origin v3.3-stable
```

This creates a permanent snapshot on GitHub that you can always return to.

---

## 🔄 Step 2 — How to Restore (Emergency)

If a new update breaks the system, run these commands to roll back to the last stable version:

```bash
# 1. Fetch all tags
git fetch --tags

# 2. Checkout the stable tag into a temporary recovery branch
git checkout tags/v3.3-stable -b recovery-v3.3

# 3. Force push the stable code back to main (CAUTION: Destructive)
git push origin recovery-v3.3:main --force
```

---

## 📝 Best Practices

- **Tag before every major push**: Especially before refactoring core NLP logic or database schemas.
- **Update the CHANGELOG**: Ensure `docs/CHANGELOG.md` reflects the changes between versions.
- **Environment Sync**: When upgrading, ensure `server/.env.example` is updated so the next restore point includes all necessary variable definitions.
