# Deployment Guide

This guide details how to deploy NewsLabs to a production environment using Supabase (Database), Render (Backend), and Vercel (Frontend).

## Prerequisites
-   A GitHub repository with the project code pushed.
-   Accounts on [Supabase](https://supabase.com/), [Render](https://render.com/), and [Vercel](https://vercel.com/).

---

## Part 1: Database Setup (Supabase)

1.  **Create a Project:**
    -   Log in to Supabase and create a new project.
    -   Save your database password securely.

2.  **Get Connection Strings:**
    -   Go to **Project Settings** -> **Database**.
    -   Under **Connection String**, select **Nodejs**.
    -   Copy the **Transaction Pooler** URL (Port 6543). This will be your `DATABASE_URL`.
    -   Copy the **Session** URL (Port 5432). This will be your `DIRECT_URL`.

3.  **Apply Schema (Manual SQL):**
    -   *Note: Due to network restrictions on direct connections from some environments, it is most reliable to use the SQL Editor.*
    -   Generate your migration SQL locally:
        ```bash
        cd server
        npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script
        ```
    -   Copy the output SQL.
    -   Go to Supabase **SQL Editor**, paste the SQL, and click **Run**.
    -   This creates all necessary tables (`User`, `Feed`, etc.).

---

## Part 2: Backend Deployment (Render)

1.  **Create Web Service:**
    -   Log in to Render and click **New +** -> **Web Service**.
    -   Connect your GitHub repository.

2.  **Configure Service:**
    -   **Name**: `newslabs-server`
    -   **Root Directory**: `server`
    -   **Runtime**: Node
    -   **Build Command**: `npm install && npm run build`
    -   **Start Command**: `npm start`

3.  **Environment Variables:**
    Add the following environment variables:

| Variable | Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://...:6543/postgres?pgbouncer=true` | Transaction Pooler URL from Supabase |
| `DIRECT_URL` | `postgresql://...:5432/postgres` | Session URL from Supabase |
| `JWT_SECRET` | `(generate-random-string)` | Secret for user authentication |
| `GROQ_API_KEY` | `gsk_...` | Your Groq Cloud API Key |
| `AI_PROVIDER` | `groq` | AI Provider Name |
| `GROQ_MODEL` | `llama-3.1-8b-instant` | Model to use |
| `PORT` | `3000` | Server Port |

4.  **Deploy:**
    -   Click **Create Web Service**.
    -   Wait for deployment to finish.
    -   **Copy the Service URL** (e.g., `https://newslabs-server.onrender.com`). You will need this for the frontend.

---

## Part 3: Frontend Deployment (Vercel)

1.  **Create Project:**
    -   Log in to Vercel and click **Add New** -> **Project**.
    -   Import your GitHub repository.

2.  **Configure Project:**
    -   **Framework Preset**: Vite
    -   **Root Directory**: `./` (Leave as default)
    -   **Build Command**: `vite build`
    -   **Output Directory**: `dist`

3.  **Environment Variables:**
    Add the backend URL:

| Variable | Value |
| :--- | :--- |
| `VITE_API_URL` | `https://newslabs-server.onrender.com` (Your Render URL) |

4.  **Deploy:**
    -   Click **Deploy**.
    -   Vercel will build the frontend and deploy it.

5.  **Fix Routing (Important):**
    -   Ensure the `vercel.json` file is present in your project root. This handles Single Page Application (SPA) routing so that refreshing pages like `/login` works correctly.
    -   *If you are reading this, the file has likely already been created for you.*

---

## Final Verification
1.  Open your Vercel URL.
2.  Try to **Sign Up** (tests Database connection + Auth).
3.  Check the homepage feed (tests RSS fetcher).
4.  Click an article to analyze (tests AI Integration/Groq).
