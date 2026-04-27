# 🤖 NewsLabs: AI & NLP Architecture Deep-Dive

This document provides a minute-by-minute technical breakdown of the AI/NLP infrastructure in NewsLabs. It is designed to support a 15-minute technical presentation.

---

## 1. The Core Philosophy: "Hybrid Intelligence"
NewsLabs does not rely on a single AI model. Instead, it uses a **Layered Hybrid Pipeline**.
- **The Problem**: Running every article through an LLM (like GPT-4 or Gemini) is too slow (5-10s latency) and too expensive.
- **The Solution**: Use lightweight, local Statistical NLP for instant categorization (Layer 0-2) and reserve "Heavy" Generative AI for Summarization and Deep Insights (Layer 3).

---

## 2. The 4-Layer Categorization Engine
When an article enters the system, it passes through these layers in **under 50ms**.

### Layer 0: Source Metadata (Fast Track)
- **Mechanism**: The system maintains a `sourceBias` map (e.g., `TechCrunch -> AI & ML`, `ESPN -> Sports`).
- **Why?**: If a source is dedicated to a niche, it's 99% likely the article belongs there. This bypasses complex analysis for known entities.

### Layer 1: Keyword Heuristics & Secondary Tagging
- **Mechanism**: A library of 100+ "weighted" keywords per category.
- **Role**: This layer handles niche topics that are too specific for the general statistical model.
- **Example**: "Kubernetes" or "Docker" triggers a +1 score for **DevOps**. "Bitcoin" or "Ethereum" triggers **Crypto**.
- **Output**: These are added as "Secondary Tags" to enrich the article beyond its primary category.

### Layer 2: Statistical NLP Classifier (The "Brain")
- **Mechanism**: **TF-IDF (Term Frequency-Inverse Document Frequency)** combined with **Logistic Regression**.
- **Model Training**: Trained on thousands of articles to recognize patterns across 9 **Primary Categories**:
    - *Technology, Business & Finance, World Affairs, Science & Space, Health, Sports, Entertainment, Climate & Environment, General*.
- **Confidence Thresholds**: The engine requires a minimum **0.25** confidence to assign a primary category.

### Layer 3: Catch-all Fallback
- Remaining articles are safely bucketed into **World** or **General** based on secondary entity detection.

---

## 3. Specialized NLP Analysts

### Sentiment Analysis (Lexicon Engine)
- **Working**: Uses a VADER-style lexicon. It scans for positive/negative "tokens" and accounts for **negations** (e.g., "not good" is flipped to negative).
- **Output**: Returns a score from -1 to +1 and identifies "intensity signals" (the specific words that caused the sentiment).

### Opinion vs. Fact Detection
- **Mechanism**: Heuristic signal detection.
- **Signals**: 
    - **Opinion**: "should", "must", "I think", "perspective", "wake up".
    - **Factual**: Numbers, percentages, dates, and "reported/announced/stated" verbs.
- **Bias Indicator**: If an article is 75%+ opinionated, it's flagged as "Strongly Opinionated".

### Reliability Scoring (The "Trust Metric")
- **Scale**: 0-100.
- **Positive Weight**: Source reputation, recency, presence of direct quotes, and data/statistics.
- **Negative Weight**: "Clickbait" pattern matching (e.g., "You won't believe what happened next") and excessive ALL-CAPS headlines.

---

## 4. Generative AI Strategy (The "Summarizer")

NewsLabs supports **Groq (Llama 3.1)** and **Gemini (3 Flash)**.

### The Hybrid Provider Logic
- **Primary**: Groq (for speed).
- **Fallback**: Gemini (if Groq fails).
- **BYOK (Bring Your Own Key)**: Users can enter their own API keys in settings. The system encrypts these and uses them for the user's specific summaries, saving platform costs and providing user-level control.

---

## 5. Detailed Prompt Engineering

Every summary request uses **JSON-Strict** mode to ensure the UI doesn't break.

### Feature: High-Fidelity Summarization
The "Balanced" Prompt (The System Default):
```text
You are an expert news analyst. Write a balanced summary (4-5 sentences). 
Preserve specific names, organizations, dates, and direct implications.
Return ONLY valid JSON:
{
  "summary": "Specific informative text...",
  "insights": ["Insight 1", "Insight 2", ...],
  "why": "2-sentence significance explanation",
  "topic": "Selected from allowed labels"
}
```
**Why this works**: By forcing JSON, we ensure the "Insights" and "Why" sections are always extractable for the UI cards.

---

## 6. Intelligence Features

### Trending Analysis
- **Working**: Performs **N-gram frequency analysis** (Unigrams and Bigrams) on the last 50 article titles.
- **Logic**: It filters out "stopwords" (the, and, for) and identifies clusters of related terms to show what's globally trending.

### Daily Brief Generation
- **Working**: Uses a weighted random selection from "High Reliability" articles across the user's favorite topics (AI, Science, India).
- **Caching**: Results are cached for 6 hours to prevent redundant LLM calls.

---

## 7. Telegram & Discord Automation: Intelligent Delivery

NewsLabs doesn't just send all news; it uses an **automated selection algorithm** to curate the "Top 10" articles for daily briefs.

### The Selection Algorithm (Reliability-Weighted)
When the `SchedulerService` triggers a delivery slot (e.g., Morning Brief), it ranks articles using a weighted formula:
- **Reliability (50%)**: Articles with higher trust scores (from the NLP engine) are prioritized.
- **Topic Match (40%)**: Articles matching the user's selected interests (AI, Science, India, etc.).
- **Recency (10%)**: A decay factor that favors articles published in the last 12-24 hours.

### Automated Formatting
- **Telegram (HTML)**: Articles are formatted into a clean, readable list with clickable titles and source attribution.
- **Discord (Embeds)**: Rich media embeds with color-coded slots (e.g., Orange for Morning, Blue for Night).
- **Deep Linking**: Every automated message includes a deep link back to the NewsLabs Dashboard for the user to read the full AI-generated analysis.

---

## 8. Technical Implementation Details
- **Architecture**: All NLP is written in **Pure TypeScript**. This means the production server has **ZERO Python dependencies** and zero overhead from calling external scripts.
- **Performance**: The entire enrichment pipeline (Sentiment + Category + Reliability) happens during the RSS fetch stream, so articles appear fully "analyzed" the moment they hit the UI.
