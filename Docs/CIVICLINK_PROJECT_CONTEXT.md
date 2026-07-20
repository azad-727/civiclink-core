# CivicLink — Full Project Memory Context

> **Purpose of this document**: A complete, authoritative reference for any AI assistant or developer
> picking up this project. Read this entirely before making any changes.

---

## 1. What Is CivicLink?

CivicLink is a **civic issue reporting and resolution platform** for municipal governments.
Citizens can report local infrastructure problems (potholes, broken streetlights, vandalism, etc.),
track their resolution status, verify issues reported by others, and explore all reports on an
interactive map. The platform is designed for Ahmedabad Municipal Corporation (AMC) but is
generic enough for any city.

**Target Users:**
- **Citizens** — Report issues, verify reports, track status
- **Municipal Officials (AMC)** — Review and resolve reported issues
- **Tech Admins** — Monitor system health and platform administration

---

## 2. Repository Structure

```
D:\CivicLink-Rebuild\
├── Backend\                    ← All Java Spring Boot microservices + Python AI
│   ├── .env                    ← Root env file (secrets for Docker)
│   ├── docker-compose.yml      ← Single command to start all services
│   ├── api-gateway\            ← Spring Cloud Gateway (port 8080)
│   ├── auth-service\           ← Spring Boot (port 8081)
│   ├── issue-service\          ← Spring Boot (port 8082)
│   ├── routing-service\        ← Spring Boot + Neo4j (port 8083)
│   └── ai-vision-service\      ← Python FastAPI (port 8084)
└── Frontend\
    └── frontend\               ← React + Vite SPA
        └── src\
```

---

## 3. Tech Stack

### Backend
| Service | Language | Framework | Database | Port |
|---|---|---|---|---|
| api-gateway | Java 21 | Spring Cloud Gateway | — | 8080 |
| auth-service | Java 21 | Spring Boot 3 | MongoDB Atlas | 8081 |
| issue-service | Java 21 | Spring Boot 3 | MongoDB Atlas | 8082 |
| routing-service | Java 21 | Spring Boot 3 | Neo4j 5 | 8083 |
| ai-vision-service | Python 3.11 | FastAPI | — | 8084 |

### Frontend
| Tool | Version / Detail |
|---|---|
| Framework | React 18 (via Vite) |
| Router | React Router v6 |
| Maps | Leaflet + react-leaflet |
| CSS | Vanilla CSS (no Tailwind) |
| HTTP Client | Custom `apiClient.js` (fetch-based, mimics Axios) |
| Auth | JWT stored in `localStorage` |
| Font | Inter (Google Fonts) |

### Infrastructure
- **Container orchestration**: Docker Compose
- **Container network**: `civiclink-network` (bridge) — services reach each other by container name
- **Image storage**: AWS S3 (presigned URL upload)
- **Map tiles**: CartoDB Voyager (Leaflet) + OpenStreetMap (iframes)
- **AI Models**: YOLOv8n (image validation), `all-MiniLM-L6-v2` (duplicate detection), Gemini 2.5 Flash (chatbot)

---

## 4. Environment Variables

**File: `D:\CivicLink-Rebuild\Backend\.env`**

```env
MONGO_URI=<MongoDB Atlas connection string>
JWT_SECRET=<HS256 secret key>
AWS_ACCESS_KEY_ID=<AWS key>
AWS_SECRET_ACCESS_KEY=<AWS secret>
AWS_REGION=ap-south-1
NEO4J_PASSWORD=<neo4j password>
NEO4J_USERNAME=neo4j
GEMINI_API_KEY=<Google Gemini API key>
```

**Frontend** (no `.env` file — values are hardcoded in `apiClient.js`):
```
BASE_URL = 'http://localhost:8080/api/v1'
```

---

## 5. Docker Compose Services

Start everything: `docker compose up --build` from `D:\CivicLink-Rebuild\Backend\`

| Container | Image Built From | Exposes |
|---|---|---|
| `civiclink-gateway` | `./api-gateway/api-gateway` | `8080:8080` |
| `civiclink-auth` | `./auth-service/auth-service` | `8081:8081` |
| `civiclink-issue` | `./issue-service/issue-service` | `8082:8082` |
| `civiclink-routing` | `./routing-service/routing-service` | `8083:8083` |
| `civiclink-ai` | `./ai-vision-service` | `8084:8084` |
| `civiclink-neo4j` | `neo4j:5` (official image) | `7474:7474`, `7687:7687` |

All inter-service communication happens over `civiclink-network`. Services call each other by
container name (e.g., `http://issue-service:8082`), never `localhost`.

---

## 6. API Gateway — Routes & Security

**Port**: 8080. All frontend requests go here. The gateway validates the JWT and forwards.

### Route Table
| Path Pattern | Forwards To | Auth Required? |
|---|---|---|
| `/api/v1/auth/**` | `auth-service:8081` | ❌ Open |
| `/api/v1/issues/**` | `issue-service:8082` | ✅ Except `/nearby` |
| `/api/v1/routing/**` | `routing-service:8083` | ✅ |
| `/api/v1/ai/**` | `ai-vision-service:8084` | ✅ |

### Open Endpoints (No JWT needed)
```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
GET  /api/v1/issues/nearby
```

### JWT Injection
After validating the JWT, the gateway extracts claims and injects them as request headers
that downstream services can trust:
- `X-User-Email` — user's email address
- `X-User-Role` — user's role (`CITIZEN`, `ADMIN`, `AMC_OFFICER`)

### CORS
Allowed origins: `http://localhost:5173`, `http://localhost:3000`
Allowed methods: `GET, POST, PUT, DELETE, OPTIONS, PATCH`

---

## 7. Auth Service (port 8081)

### Endpoints
```
POST /api/v1/auth/register   → Register new user
POST /api/v1/auth/login      → Login, returns JWT + refresh token
POST /api/v1/auth/refresh    → Exchange refresh token for new JWT
```

### `AuthResponse` Shape (what login returns)
```json
{
  "token": "<JWT>",
  "refreshToken": "<UUID>",
  "username": "John",
  "email": "john@example.com",
  "role": "CITIZEN"
}
```

### User Model (MongoDB collection: `users`)
```java
String id;
String username;
String email;
String password;         // BCrypt hashed
Role role;               // Enum: CITIZEN, ADMIN, AMC_OFFICER
Instant createdAt;
```

### JWT
- Algorithm: HS256
- Expiry: (configured via `JWT_SECRET`)
- Claims: `email`, `role`

---

## 8. Issue Service (port 8082)

### Endpoints
```
POST   /api/v1/issues                         → Create issue [Auth: X-User-Email]
GET    /api/v1/issues/{issueId}               → Get issue details [Auth]
GET    /api/v1/issues/nearby?lat&lng&radius   → Get nearby issues [Public]
GET    /api/v1/issues/profile                 → Get user's own issues [Auth: X-User-Email]
PATCH  /api/v1/issues/{issueId}/verify        → Verify issue [Auth: X-User-Email]
PATCH  /api/v1/issues/{issueId}/status        → Update status [Auth: X-User-Role=ADMIN]
GET    /api/v1/issues/contributors/top        → Top contributors leaderboard [Auth]
GET    /api/v1/issues/storage/presigned-url   → Get S3 presigned URL for image upload [Auth]
```

### Issue Request DTO
```json
{
  "title": "string",
  "description": "string",
  "category": "Roads & Transit | Public Safety | Parks & Vandalism | Sanitation & Waste",
  "latitude": 23.0225,
  "longitude": 72.5714,
  "imageLink": "https://s3-bucket-url/image.jpg"
}
```

### Issue Model (MongoDB collection: `issues`)
```java
String id;
String title;
String descriptions;          // NOTE: field is "descriptions" (plural) not "description"
String category;
String status;                // "OPEN" | "IN_PROGRESS" | "RESOLVED" | "REJECTED_BY_AI" | "REJECTED"
String imageUrl;
String reportedBy;            // email address
GeoJsonPoint location;        // GeoJSON — coordinates[0]=lng, coordinates[1]=lat
int aiSeverityScore;          // 0–10 (set by AI after image validation)
String aiAnalysisNotes;
int verificationCount;
Set<String> verifiedByUsers;  // Set of emails who verified this issue
Instant createdAt;
```

> ⚠️ **Critical**: The description field in the DB is called `descriptions` (plural). The frontend
> reads it as `issue.descriptions || issue.description`.

### Issue Submission Flow (3-step)
1. **Frontend** calls `GET /api/v1/issues/storage/presigned-url?filename=xxx` → gets S3 presigned URL
2. **Frontend** `PUT` uploads the image file directly to S3 (bypasses backend)
3. **Frontend** `POST /api/v1/issues` with the final S3 image URL

### Post-Save AI Trigger (async background thread)
After issue is saved to MongoDB, `IssueService.triggerAiValidation()` fires in a background thread:
- Calls `POST http://civiclink-ai:8084/api/v1/ai/validate-image` with `{issue_id, image_url}`
- AI runs YOLOv8 on the image → sets `aiSeverityScore` and `status="OPEN"` or `"REJECTED_BY_AI"`

### Duplicate Detection (pre-submission, implemented)
- Backend: `IssueService.checkForDuplicates(description, lat, lng)` → fetches 20 nearby issues → calls AI
- AI: `POST /api/v1/ai/detect-duplicate` → compares text embeddings (cosine similarity > 0.75)
- ⚠️ The `/api/v1/issues/check-duplicate` **controller endpoint is not yet wired** — service method exists but no HTTP endpoint added to `IssueController.java` yet
- Frontend: `ReportIssue.jsx` does **not yet** call the duplicate check endpoint before submission

### Verify Issue
- Tracks `verifiedByUsers` (Set of emails) — prevents double verification
- Returns HTTP 409 Conflict if user already verified
- Frontend `IssueDetail.jsx` catches 409 and shows "Already Verified" button state

---

## 9. AI Vision Service (port 8084)

**Language**: Python 3.11 | **Framework**: FastAPI | **Container**: `civiclink-ai`

### Endpoints
```
POST /api/v1/ai/validate-image    → YOLOv8 image validation
POST /api/v1/ai/detect-duplicate  → Sentence embedding duplicate check
POST /api/v1/ai/chat              → Gemini-powered civic chatbot
```

### `/api/v1/ai/validate-image`
Request:
```json
{ "issue_id": "string", "image_url": "https://..." }
```
Response:
```json
{
  "issue_id": "string",
  "status": "PROCESSED",
  "is_valid_civic_issue": true,
  "detections": [{"object": "car", "confidence": 0.87}],
  "max_confidence": 0.87
}
```
Logic: Downloads image, runs YOLOv8n. If max confidence > 0.60 → `is_valid_civic_issue = true`

### `/api/v1/ai/detect-duplicate`
Request:
```json
{
  "new_issue": {"issue_id": "new-check", "description": "...", "lat": 23.0, "lng": 72.5},
  "recent_issues": [{"issue_id": "abc", "description": "...", "lat": 23.0, "lng": 72.5}]
}
```
Response:
```json
{
  "is_duplicate": false,
  "potential_duplicates": [{"issue_id": "abc", "similarity_score": 0.88}]
}
```
Logic: Uses `all-MiniLM-L6-v2` SentenceTransformer to encode descriptions. Cosine similarity > 0.75 = duplicate.

### `/api/v1/ai/chat`
Request: `{ "user_message": "What is the status of issue 123?" }`
Response: `{ "reply": "The issue is currently IN_PROGRESS..." }`

Logic: Gemini 2.5 Flash with a function-calling tool `get_issue_status(issue_id)`.
When triggered, fetches real data from `http://api-gateway:8080/api/v1/issues/{id}` and includes in reply.

---

## 10. Routing Service (port 8083)

- Backed by **Neo4j 5** (graph database)
- Provides safe-path routing that avoids reported civic issues
- Neo4j browser UI: `http://localhost:7474`
- Neo4j bolt: `bolt://localhost:7687`

---

## 11. Frontend — Complete Page & Component Map

**Dev server**: `npm run dev` in `D:\CivicLink-Rebuild\Frontend\frontend\`
**Base URL**: `http://localhost:5173`

### Routing (`App.jsx`)
```
/               → RootRedirect (→ /home if logged in, → /login if guest)
/home           → Home.jsx            [Public]
/explore        → ExploreMap.jsx      [Public]
/issue/:id      → IssueDetail.jsx     [Public]
/login          → Login.jsx           [Public]
/register       → SignUp.jsx          [Public]
/about          → About.jsx           [Public]
/report         → ReportIssue.jsx     [Protected — requires login]
/profile        → Profile.jsx         [Protected — requires login]
*               → NotFound.jsx
```

### Layout (`AppLayout.jsx`)
Every page renders inside `AppLayout` which wraps with:
- `<Navbar />` — sticky top, z-index 1100
- `<Outlet />` — page content
- `<Footer />` — hidden on `/explore`
- `<ChatWidget />` — fixed bottom-right FAB (z-index 100, bottom 100px)

### Pages
| File | Description |
|---|---|
| `Home.jsx` | Hero banner image, live stats (total/resolved issues, contributors), map embed card, Recent Activity sidebar with thumbnails, Top Contributors grid |
| `ExploreMap.jsx` | Full-screen Leaflet map + sidebar with issue list, search, category filters, distance sort, quick action filters |
| `IssueDetail.jsx` | Issue title, image gallery, description, mini Leaflet map, Verify button (tracks `hasVerified` state, shows "Already Verified" after click/409), submitter info, status badge |
| `ReportIssue.jsx` | Multi-step form: title, category, description, photo upload → S3 presigned URL → issue POST. GPS auto-detect + manual Nominatim geocoding. |
| `Login.jsx` | Email/password form → POST `/api/v1/auth/login` → stores token + user in localStorage |
| `SignUp.jsx` | Registration form → POST `/api/v1/auth/register` |
| `Profile.jsx` | Shows user info + list of their reported issues |
| `About.jsx` | Static about page |
| `NotFound.jsx` | 404 page |

### Components
| File | Description |
|---|---|
| `Navbar.jsx` | Sticky top nav with desktop links, search (navigates to `/explore?search=`), user icon, mobile hamburger menu |
| `Navbar.css` | Navbar z-index: 1100. Mobile menu: `position: fixed`, z-index: 1099 (above ExploreMap sidebar z-index 1000) |
| `Footer.jsx` | Dark footer with quick links, social icons, copyright |
| `ChatWidget.jsx` | Floating chat bubble. Opens panel with Gemini AI chatbot. Fixed bottom: 100px, right: 24px |
| `ProtectedRoute.jsx` | Redirects unauthenticated users to `/login` |

### Auth Flow (`AuthContext.jsx`)
- `user` and `token` initialized lazily from `localStorage` (safe JSON parse)
- `login(userData, token)` — stores to state + localStorage
- `logout()` — clears state + localStorage
- `isAuthenticated` — derived boolean: `!!user`
- Context exposed via `useAuth()` hook

### API Client (`apiClient.js`)
```javascript
BASE_URL = 'http://localhost:8080/api/v1'

// All requests auto-attach: Authorization: Bearer <token>
// Methods: apiClient.get(), .post(), .put(), .patch(), .delete()
// Returns parsed JSON or throws Error with message
```

---

## 12. Key Data Flows

### Login
```
User fills form → POST /api/v1/auth/login
  → AuthController returns { token, refreshToken, username, email, role }
  → Frontend: login(userData, token) → localStorage
  → Navigate to /home
```

### Report an Issue
```
1. GET /api/v1/issues/storage/presigned-url?filename=xxx → S3 presigned URL
2. PUT <presigned-url> (direct to S3, with Content-Type: image/jpeg)
3. POST /api/v1/issues { title, description, category, latitude, longitude, imageLink }
   Headers: Authorization: Bearer <token>, X-User-Email: (added by gateway)
4. Backend saves to MongoDB → fires background thread → AI validates image → updates status
```

### Explore Map
```
GET /api/v1/issues/nearby?latitude=X&longitude=Y&radius=10000.0 (public)
  → Returns array of Issue objects with GeoJSON location
  → Frontend extracts: lat = location.coordinates[1], lng = location.coordinates[0]
  → Displays Leaflet markers, list cards, filters
```

---

## 13. Known Issues & Bugs Fixed

| # | Issue | Status | Fix Applied |
|---|---|---|---|
| 1 | Root `/` showed blank page, footer floated up | ✅ Fixed | `RootRedirect` component in `App.jsx` |
| 2 | Verify button didn't show "Already Verified" after clicking | ✅ Fixed | `hasVerified` state + 409 detection in `IssueDetail.jsx` |
| 3 | ChatWidget FAB covered map recenter button | ✅ Fixed | `bottom: 100px` in `ChatWidget.css` |
| 4 | Recent Activity had no photo thumbnail | ✅ Fixed | 48×48 thumbnail added in `Home.jsx` + `Home.css` |
| 5 | Mobile menu overlapped "Local Issues" sidebar | ✅ Fixed | Mobile menu `position: fixed`, z-index 1099; navbar z-index 1100 |
| 6 | `JSON.parse("undefined")` crash in `AuthContext` | ✅ Fixed | Safe lazy initializer with null guard |

---

## 14. Feature Roadmap (Agreed, Not Yet Built)

### Phase 2 — AI Duplicate Detection (In Progress)
- ✅ AI service `/detect-duplicate` endpoint exists and works
- ✅ `IssueService.checkForDuplicates()` method added
- ❌ `IssueController.java` missing `/check-duplicate` HTTP endpoint — **needs to be added**
- ❌ `ReportIssue.jsx` doesn't call duplicate check before submission — **needs frontend UI**

### Phase 3 — Advanced Civic Features
- **7. Multi-language + Voice Reporting** — Web Speech API for voice input, i18n library for translations, SMS/IVR via Twilio
- **8. Emergency SOS** — One-tap button captures live geolocation, routes alert to emergency webhook
- **9. Participatory Decisions** — New microservice for Polls and participatory budgeting on local proposals
- **10. Public Leaderboard** — Analytics dashboard: avg resolution time, % resolved within SLA, by ward/department

### Phase 4 — Admin Panels
- **11a. Tech Admin Panel** — System health dashboard (microservice status, logs, error rates)
- **11b. AMC Officer Panel** — Issue management dashboard: view/filter/update issue statuses, analytics
- Implementation: Protected routes under `/admin/*` with RBAC (role check: `AMC_OFFICER` / `ADMIN`)

---

## 15. Important Notes for Any AI Picking This Up

1. **Description field is `descriptions` (plural)** — the MongoDB field and Java getter is `descriptions`, not `description`. The frontend reads both: `issue.descriptions || issue.description`

2. **Location coordinates are GeoJSON** — `location.coordinates[0]` = longitude, `location.coordinates[1]` = latitude (GeoJSON standard, reversed from what you might expect)

3. **Z-index hierarchy** — Navbar: 1100, Mobile menu: 1099, ExploreMap sidebar: 1000, ChatWidget: 100

4. **No Tailwind** — All styling is pure Vanilla CSS. Never add Tailwind classes.

5. **The `apiClient.js` is not Axios** — It's a custom fetch wrapper. It auto-attaches the Bearer token. Use `apiClient.get()`, `.post()` etc.

6. **JWT claims** — The gateway extracts `email` and `role` from the JWT and injects them as `X-User-Email` and `X-User-Role` headers. Downstream services read these headers, not the JWT itself.

7. **CORS origin** — Only `localhost:5173` and `localhost:3000` are allowed. Update `GatewayConfig.java` for production.

8. **Image upload** — Images NEVER go through the Java backend. They go directly to S3 via a presigned URL. The backend only stores the final public S3 URL.

9. **AI is called asynchronously** — Image validation fires in a background thread after issue is saved. The issue is saved first (status: OPEN), then updated by AI. Duplicate check is synchronous (pre-save).

10. **Docker only** — The services are intended to run via Docker Compose. Running individually requires setting environment variables manually.
