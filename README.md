# NewsLabs

NewsLabs is an intelligent news aggregation and analysis platform powered by AI. It curates news from various RSS feeds, provides AI-generated summaries and insights, and offers a personalized reading experience.

## Features

-   **AI-Powered Analysis**: instant summaries, key insights, and "Why it matters" explanations for every article using Groq (Llama 3).
-   **Smart Aggregation**: Automatically fetches and categorizes news from top tech and world news sources.
-   **Personalized Feeds**: Learn from your reading habits to suggest relevant content.
-   **User Accounts**: Secure authentication, saved articles, read history, and cross-device synchronization.
-   **Modern UI**: Responsive, dark-mode enabled interface built with React and Tailwind CSS.
-   **Interactive Elements**: Like, save, and track your reading stats.

## Tech Stack

### Frontend
-   **Framework**: React (Vite)
-   **Styling**: Tailwind CSS, Radix UI, Lucide Icons
-   **State Management**: React Query, Context API
-   **Routing**: React Router
-   **HTTP Client**: Axios

### Backend
-   **Runtime**: Node.js
-   **Framework**: Fastify
-   **Database ORM**: Prisma
-   **Authentication**: JWT (JSON Web Tokens)
-   **AI Integration**: Groq SDK

### Database
-   **Database**: PostgreSQL (Supabase)
-   **Connection Pooling**: Supabase Transaction Pooler (PgBouncer)

## Prerequisites

-   Node.js (v18 or higher)
-   npm (v9 or higher)
-   A Supabase account (for PostgreSQL)
-   A Groq Cloud account (for AI features)

## Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd newslabs
    ```

2.  **Install Frontend Dependencies:**
    ```bash
    npm install
    ```

3.  **Install Backend Dependencies:**
    ```bash
    cd server
    npm install
    ```

## Local Configuration

1.  **Backend Environment (`server/.env`):**
    Create a `.env` file in the `server` directory:
    ```env
    # Database (Supabase Transaction Pooler)
    DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
    
    # Direct Connection (for migrations - if network allows)
    # Note: Port 5432 might be blocked on some networks. Use Supabase SQL Editor if so.
    DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

    # Security
    JWT_SECRET="your-super-secret-key"
    PORT="3000"

    # AI Service (Groq)
    GROQ_API_KEY="gsk_..."
    AI_PROVIDER="groq"
    GROQ_MODEL="llama-3.1-8b-instant"
    ```

2.  **Frontend Environment (`.env`):**
    Create a `.env` file in the root directory:
    ```env
    VITE_API_URL="http://localhost:3000"
    ```

## Running Locally

1.  **Start the Backend:**
    Open a terminal in the `server` directory:
    ```bash
    npm run dev
    ```
    Server will start at `http://localhost:3000`.

2.  **Start the Frontend:**
    Open a new terminal in the root directory:
    ```bash
    npm run dev
    ```
    Frontend will start at `http://localhost:8080`.

3.  **Access the App:**
    Open `http://localhost:8080` in your browser.
