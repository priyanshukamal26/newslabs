# Antigravity Versioning & Restore Guide

## Project State

Project: Antigravity
Current Stable Release: v1.0
Hosting: Vercel + Render
GitHub Production Branch: main
Local Development Version: v2.0

Version 1.0 is currently deployed in production.
Before pushing version 2.0, a permanent restore point must be created.

---

## Restore Strategy

Version 1.0 will be preserved using:

1. **Git Tag** (permanent snapshot)
2. **Backup Branch**
3. **Git history**

This ensures production can be reverted instantly if version 2.0 fails.

---

## Step 1 — Create Version Tag for v1.0

Run the following commands:

git checkout main
git pull origin main
git tag -a v1.0-stable -m "Antigravity stable production release v1.0"
git push origin v1.0-stable

This creates a permanent snapshot of the production release.

---

## Step 2 — Create Backup Branch

git branch backup/v1.0
git push origin backup/v1.0

This keeps a branch copy of the production state.

---

## Step 3 — Push Antigravity v2.0

Once the restore point exists, version 2.0 can safely be deployed.

git add .
git commit -m "Release Antigravity v2.0"
git push origin main

This will trigger deployment on Vercel and Render.

---

## How to Restore Version 1.0

If version 2.0 breaks production, run:

git checkout main
git reset --hard v1.0-stable
git push origin main --force

This will restore the exact version 1.0 codebase and redeploy it.

---

## Version History

v1.0
Status: Stable Production Release
Deployment: Vercel + Render
Tag: v1.0-stable

v2.0
Status: Pending Deployment
Branch: main (after push)

---

## Best Practices

Never develop directly on main.
Always tag stable releases before deploying new versions.
