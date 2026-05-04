# NewsLabs: Viva & Study Guide (INT428)

This document is designed to help you prepare for the project viva. It breaks down the technical architecture into study topics and provides a detailed response to the official assessment manual.

---

## Part 1: Viva Preparation Topics

### 1. Data Ingestion & Orchestration
- **RSS Polling:** The system utilizes `rss-parser` to fetch XML feeds from over 27 sources. To prevent I/O blocking and server resource exhaustion, feeds are processed in **chunks of 4** using a semaphore-like logic. An **AbortController** is implemented with a strict **8-second timeout** per request to ensure that unresponsive or slow external servers do not cause the internal `SchedulerService` to hang or leak memory.
- **In-Memory Store:** A volatile, high-speed in-memory store (implemented via a Map/Cache) is used for the active news feed to ensure sub-millisecond response times for the dashboard. However, critical user-specific data—such as "Liked" articles, reading streaks, and saved briefs—is persisted to a **PostgreSQL** database via Prisma to ensure long-term data durability and cross-session persistence.

### 2. The NLP Classification Engine (Core AI)
- **Layered Logic:** The system uses a multi-stage pipeline:
    - **Layer 0 (Source Bias):** Instant tagging based on known source expertise (e.g., TechCrunch = Technology).
    - **Layer 1 (Keywords):** Weighted keyword matching for specific niche entities (e.g., "NASA" = Space).
    - **Layer 2 (Statistical):** TF-IDF + Logistic Regression for broad categorization across 9 primary classes.
    - **Layer 3 (Fallback):** Rules-based routing for general news and entity-based redirection.
- **TF-IDF (Term Frequency-Inverse Document Frequency):** This is a mathematical method used to convert text into numerical vectors. It calculates word importance by comparing how often a word appears in a specific article (TF) vs. how common it is across the entire news corpus (IDF), effectively filtering out "noise" words.
- **Logistic Regression:** This model was chosen over Deep Learning for its extreme speed, zero-dependency footprint, and high interpretability. It allows the system to perform classification in pure TypeScript without needing a Python backend or heavy GPU resources.
- **The "Mathematical Bridge":** The model calculates a raw "logit" score for each category. These scores are passed through a **Softmax** function to convert them into a probability distribution (0 to 1). The category with the highest probability (above a 0.25 threshold) is assigned as the primary tag.
- **Inference Latency:** By implementing the matrix multiplication directly in **Pure TypeScript**, categorization happens in **<1ms**. This is orders of magnitude faster than calling external AI APIs (500ms+) and allows for real-time analysis during the RSS ingestion stream.

### 3. Transformers & Sentiment Analysis
- **Xenova Transformers:** This library allows us to run Python-grade models inside Node.js by leveraging **WebAssembly (WASM)** and the **ONNX Runtime**. It enables the execution of complex Transformer models (like DistilBERT) directly in the backend process at near-native speeds.
- **SST-2 Model:** This refers to the **Stanford Sentiment Treebank** model, a pre-trained transformer optimized for binary sentiment classification. It allows NewsLabs to detect the emotional tone of news with high contextual accuracy compared to basic keyword lists.
- **Fallback Logic:** If the transformer model fails to load or the system is under heavy load, it reverts to a **VADER-style Lexicon** matcher. This uses a pre-defined dictionary of words with assigned sentiment weights to provide an instant, though less contextual, sentiment score.

### 4. Generative AI & Prompt Engineering
- **Hybrid Routing:** **Groq (Llama 3.1)** is the primary provider due to its LPU (Language Processing Unit) architecture, offering industry-leading speed (200+ tokens/sec). **Google Gemini 1.5 Flash** serves as a fallback, providing high reliability and massive context windows if Groq hits rate limits.
- **Strict JSON Mode:** We utilize the "JSON Object" response format in API calls. By providing a strict schema in the system prompt, we ensure the LLM returns structured data that the frontend can immediately map to UI components without conversational "filler" text.
- **BYOK (Bring Your Own Key):** This architectural pattern allows users to input their own API keys (encrypted via AES-256). This eliminates platform costs while ensuring that users have full ownership and privacy over their AI interactions.

### 5. System Design & Scheduling
- **Cron Jobs:** The system uses `node-cron` to manage 4 daily briefing slots (IST: 6AM, 2PM, 6PM, 10PM). It also handles data maintenance, such as purging articles older than 72 hours from the archive.
- **Reliability Formula:** Articles are ranked using a weighted score: `(Reliability * 0.5) + (Topic Match * 0.4) + (Recency * 0.1)`. This ensures that the most trustworthy and relevant news reaches the top of the briefing list.
- **Security:** Sensitive data like user API keys are never stored in plain text. They are encrypted using **AES-256-GCM**, providing both confidentiality and integrity protection (authenticated encryption).

---

## Part 2: Project-Based Assessment Manual (INT428 Response)

### Section A: Project Overview
**Q1. Type of Chatbot Developed:**  
☐ Generative (LLM-based)  
**☑ Hybrid**  
*Note: NewsLabs is a hybrid platform that uses Rule-based heuristics for speed, Machine Learning (Logistic Regression) for categorization, and Generative AI (LLMs) for content summarization.*

**Q2. Platform Used for Deployment:**  
**☑ Web Application**  
**☑ Messaging Platform (Telegram/Discord)**  
*Note: The platform is a web dashboard with integrated bot notifications.*

---

### Section B: Model & API Details
**Q4. Type of API Used:**  
**☑ Custom REST API** (Backend)  
**☑ Google Gemini / Groq API** (AI Logic)

**Q5. Model Name Used:**  
Model Name: **Llama 3.1 8B (Groq) & Gemini 1.5 Flash**

**Q6. Model Version:**  
Model Version: **v3.1 (Llama) / v1.5 (Gemini)**

---

### Section C: Context & Data Handling
**Q7. Contextual Memory Usage:**  
**☑ Long-term memory (Database/PostgreSQL)**  
*Note: User preferences, reading history, and saved articles are persisted long-term to personalize the experience.*

**Q8. Flow of Data in the Chatbot:**  
1. **Ingestion:** RSS XML is fetched from sources.  
2. **Preprocessing:** Text is cleaned via Regex and tokenized.  
3. **ML Layer:** The article is categorized using a local TF-IDF model.  
4. **Sentiment Layer:** A DistilBERT transformer assigns a tone.  
5. **Generative Layer:** Upon user request, the LLM generates a summary using the provided API key.  
6. **Delivery:** Summaries are displayed on the Dashboard or sent via Telegram.

---

### Section D: Model Configuration & Behavior
**Q9. Model Parameters Used:**  
- **Temperature: 0.2** (Low temperature ensures factual, deterministic summaries suitable for news).  
- **Top-p: 0.9** (Ensures linguistic diversity while staying within the "safe" token probability mass).  
- **Input Token Limit: 5,000 chars** (To stay within context windows and minimize costs).

**Q10. Thinking Level & Role Assignment:**  
**Thinking Level:** Advanced (Multi-step reasoning: Summarize → Extract Insights → Categorize).  
**Role Assigned:** **Domain Expert** (The model is instructed to act as a "Premium News Analyst").

---

### Section E: Technology Stack
**Q11. Technology Stack Used:**  
- **Frontend:** React 18, Vite, Framer Motion, Lucide.  
- **Backend:** Fastify (Node.js), TypeScript, Axios.  
- **Database:** PostgreSQL, Prisma ORM.  
- **NLP/AI:** Groq SDK, Google Generative AI, Xenova Transformers (DistilBERT).  
- **Hosting:** Vercel (Frontend), Render (Backend), Supabase (Postgres).

---

### Section F: Implementation Evidence
**Q12. API Call Description:**  
The system uses the `groq-sdk` to make asynchronous POST requests. The request body includes `response_format: { type: "json_object" }` to ensure the model output is directly map-able to our TypeScript `Article` interface.

**Q13. Chatbot Working Interface:**  
The interface uses a **Brutalist Newsprint** design. Key elements include the "Reading Lab" (analytics heatmap), "NpChips" for category tags, and the "AI Analysis" panel which appears when an article is selected.

**Q14. GitHub Repository Link:**  
Repository URL: [https://github.com/priyanshukamal26/newslabs](https://github.com/priyanshukamal26/newslabs)
