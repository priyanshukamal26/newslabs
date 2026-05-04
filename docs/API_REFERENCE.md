# NewsLabs API Reference

Base URL (local): `http://localhost:3000`  
Base URL (production): set via your Render / backend deployment URL.

**Authentication:** Protected routes require a `Bearer` token in the `Authorization` header:
```
Authorization: Bearer <JWT_TOKEN>
```
Tokens are returned from `/api/auth/register` and `/api/auth/login`.

---

## Health Check

### `GET /health`
Returns server status.

**Response**
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "database": "connected",
  "nlpClassifier": "ready"
}
```
> `nlpClassifier` values: `"ready"` | `"training"` | `"failed"`


---

## Auth — `/api/auth`

### `POST /api/auth/register`
Create a new user account.

**Body**
```json
{
  "email": "user@example.com",
  "password": "min6chars",
  "name": "Jane Doe"         // optional
}
```

**Response `200`**
```json
{
  "token": "<JWT>",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Jane Doe",
    "topics": [],
    "aiProvider": "hybrid"
  }
}
```

---

### `POST /api/auth/login`
Authenticate an existing user.

**Body**
```json
{ "email": "user@example.com", "password": "yourpassword" }
```

**Response `200`** — same shape as `/register`.

---

### `PUT /api/auth/update` 🔒
Update the authenticated user's topic preferences.

**Body**
```json
{ "topics": ["AI & ML", "Science", "India"] }
```

**Response `200`**
```json
{ "user": { "id": "...", "email": "...", "topics": ["AI & ML", "Science", "India"], "aiProvider": "hybrid" } }
```

---

## Content — `/api/content` and `/api/public`

> `/api/public` is an alias for `/api/content` (used for unauthenticated access).

### `GET /api/content/feed`
Returns all cached articles. Triggers a background RSS fetch if the store is empty.

**Response `200`** — array of `Article` objects:
```json
[
  {
    "id": "uuid",
    "title": "Article Title",
    "link": "https://...",
    "pubDate": "Mon, 01 Jan 2025 00:00:00 GMT",
    "source": "TechCrunch",
    "topic": "AI & ML",
    "summary": "Click to analyze",
    "why": "Pending analysis",
    "insights": [],
    "timeToRead": "3 min",
    "likes": 0,
    "contentSnippet": "..."
  }
]
```

---

### `POST /api/content/refresh`
Force a synchronous RSS refresh and return updated counts.

**Response `200`**
```json
{ "message": "Refreshed", "count": 450, "newCount": 12 }
```

---

### `POST /api/content/analyze`
Trigger AI analysis for a single article. Returns immediately if already analyzed (unless `forceMode` is used).

**Body**
```json
{
  "id": "article-uuid",
  "summaryMode": "balanced",   // optional: "concise" | "balanced" | "detailed"
  "forceMode": "force",       // optional: "force" to bypass cache
  "title": "Article Title",   // optional fallback
  "link": "https://..."      // optional fallback
}
```

**Headers** *(optional)*: `Authorization: Bearer <JWT>` — uses user's preferred AI provider if provided.

**Response `200`** — full `Article` object with populated `summary`, `insights`, `why`, `topic`, `sentiment`, `reliability`, etc.

---

### `GET /api/content/trending`
Returns top 7 trending words extracted from article titles.

**Response `200`**
```json
{ "trends": ["OpenAI", "Quantum", "AI", "Climate", "Gemini", "SpaceX", "Nvidia"] }
```

---

### `GET /api/content/insights`
Returns computed insights from the article store.

**Response `200`**
```json
{
  "topTrend": { "name": "AI & ML", "count": 42 },
  "mostReadTopic": { "name": "AI & ML", "percentage": 38 },
  "emerging": { "name": "Space", "growth": "+12%" }
}
```

---

### `GET /api/content/daily-brief`
Returns 3 curated articles (AI, Science, Tech). Cached for 6 hours. Articles are pulled from the last 72 hours of data.

**Response `200`**
```json
{
  "articles": [
    { "topic": "AI", "title": "...", "time": "3 min", "summary": "...", "link": "https://..." },
    { "topic": "Science", "title": "...", "time": "4 min", "summary": "...", "link": "https://..." },
    { "topic": "Technology", "title": "...", "time": "2 min", "summary": "...", "link": "https://..." }
  ],
  "cachedAt": "2025-01-01T00:00:00.000Z",
  "expiresAt": "2025-01-01T06:00:00.000Z"
}
```

---

## User — `/api/user` 🔒
All endpoints require `Authorization: Bearer <JWT>`.

### `GET /api/user/profile`
Get full user profile. Also updates the daily login streak.

**Response `200`**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "Jane Doe",
  "phone": null,
  "darkMode": true,
  "aiProvider": "hybrid",
  "topics": ["AI & ML", "Science"],
  "createdAt": "2025-01-01T00:00:00.000Z",
  "totalReads": 52,
  "totalReadTime": 184,
  "loginDays": 14,
  "currentStreak": 5,
  "longestStreak": 12
}
```

---

### `PUT /api/user/profile`
Update profile fields.

**Body** *(all optional)*
```json
{
  "name": "Jane Doe",
  "phone": "+1234567890",
  "email": "new@example.com",
  "darkMode": false,
  "aiProvider": "gemini"
}
```

`aiProvider` must be one of: `groq` | `gemini` | `hybrid`.

---

### `PUT /api/user/password`
Change password.

**Body**
```json
{ "currentPassword": "oldpass", "newPassword": "newpass123" }
```

---

### `GET /api/user/stats`
Reading statistics and weekly activity chart data.

**Response `200`**
```json
{
  "thisWeek": 8,
  "lastWeek": 5,
  "streak": 5,
  "longestStreak": 12,
  "totalReads": 52,
  "totalSaved": 14,
  "totalLiked": 9,
  "avgReadTime": "4 min",
  "loginDays": 14,
  "change": "+60%",
  "weeklyData": [
    { "day": "Mon", "count": 2 },
    { "day": "Tue", "count": 0 },
    ...
  ]
}
```

---

### `POST /api/user/like/:articleId`
Toggle like on an article. Calling twice un-likes it.

**Body** *(optional — used to persist article metadata)*
```json
{
  "title": "Article Title",
  "source": "TechCrunch",
  "topic": "AI & ML",
  "link": "https://...",
  "summary": "...",
  "timeToRead": "3 min",
  "pubDate": "..."
}
```

**Response `200`**
```json
{ "liked": true, "message": "Added to likes" }
// or
{ "liked": false, "message": "Removed from likes" }
```

---

### `POST /api/user/save/:articleId`
Toggle save on an article. Same body shape as `/like/:articleId`.

**Response `200`**
```json
{ "saved": true, "message": "Saved to reading list" }
```

---

### `POST /api/user/read/:articleId`
Record that a user read an article (idempotent — only counts once per article).

**Body**
```json
{ "timeSpent": 4 }  // minutes
```

---

### `GET /api/user/liked`
Returns the user's liked articles (newest first).

---

### `GET /api/user/saved`
Returns the user's saved/bookmarked articles (newest first).

---

### `GET /api/user/interactions`
Efficient batch-check for like/save state across all articles.

**Response `200`**
```json
{
  "likedIds": ["article-uuid-1", "article-uuid-2"],
  "savedIds": ["article-uuid-3"]
}
```

---

### `GET /api/user/notifications`
Returns up to 20 newest notifications for the user.

**Response `200`** — array of Notification objects:
```json
[
  { "id": "uuid", "title": "...", "message": "...", "read": false, "createdAt": "..." }
]
```

---

### `PUT /api/user/notifications/:id/read`
Mark a specific notification as read.

---

### `PUT /api/user/notifications/read-all`
Mark all unread notifications as read.

---

## AI Pipelines

---

### `POST /api/ai/summarize`
Generate AI summary for a specific article or text block. Uses the user's preferred AI provider (if BYOK is enabled) or the system's hybrid pipeline.

**Body**
```json
{
  "text": "Full article content or snippet...",
  "sessionTimeoutSeconds": 30 // optional: 0, 10, 30, 60, 120
}
```

**Response `200`**
```json
{
  "summary": "...",
  "insights": ["...", "..."],
  "why": "...",
  "topic": "...",
  "usedSystemFallback": false,
  "timerUnlocked": true
}
```

---

## Error Responses

All errors follow this shape:
```json
{ "error": "Human-readable error message" }
```

| Status | Meaning |
|---|---|
| `400` | Bad request / validation error |
| `401` | Missing or invalid JWT token |
| `404` | Resource not found |
| `500` | Internal server / AI service error |
