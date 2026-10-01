# 🚀 DevSphere Backend

A production-grade, highly scalable backend for a modern social networking platform. Built with Node.js, Express, and MongoDB, this API features a dual REST/GraphQL architecture, real-time WebSockets, background job processing, and enterprise-level security.

## 🌟 Key Features

- **Dual API Architecture:** Standard RESTful endpoints for CRUD operations and a GraphQL interface (Apollo Server) to eliminate overfetching on complex frontend feeds.
- **Real-Time Infrastructure:** Live chat, typing indicators, and presence tracking powered by Socket.io and Upstash Redis.
- **Background Processing:** BullMQ queues for non-blocking email delivery (verification, password resets) and notification digests.
- **Advanced Search:** MongoDB Atlas Search (Apache Lucene) replacing slow Regex with typo-tolerant, relevance-ranked querying.
- **Production Security:** Hardened with Helmet.js (CSP), Express-Mongo-Sanitize, robust rate limiting, and secure JWT rotation (HttpOnly cookies).
- **File Management:** Direct-to-cloud media uploads via Multer and Cloudinary.
- **Web Push Notifications:** Native OS-level push notifications using VAPID keys and Service Workers.

## 🏗️ Tech Stack

- **Core:** Node.js (v20), Express.js (ES Modules), Apollo Server (GraphQL)
- **Database:** MongoDB Atlas, Mongoose
- **Caching & Queues:** Redis, BullMQ
- **Real-time:** Socket.io
- **DevOps & CI/CD:** Docker, Docker Compose, GitHub Actions, Jest, Supertest
- **Logging & Docs:** Winston, Morgan, Swagger (OpenAPI)

---

## 🐳 Quick Start (Docker)

The easiest way to run DevSphere locally is using Docker. This spins up the Node.js API, a local Redis instance (for background queues and socket presence), and a local MongoDB instance in an isolated network.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/DevSphere.git
   cd DevSphere
   ```
2. **Setup Environment Variables:**

   ```bash
   cp .env.example .env
   ```

   _(Populate your `.env` with your JWT secrets, Cloudinary credentials, and Mailtrap keys)._

3. **Boot the Infrastructure:**

   ```bash
   docker-compose up --build -d
   ```

4. **Seed the Database with Test Data:**
   ```bash
   docker-compose exec app npm run seed
   ```

---

## 📖 API Documentation & Usage Guide

DevSphere provides interactive, built-in documentation. By default, the server runs on `http://localhost:3000`.

### 1. Authentication (REST)

Most routes are protected. You must first create an account and log in to receive an Access Token.

- **Register:** `POST /api/v1/auth/register`
  - _Body (JSON):_ `{ "name": "John Doe", "email": "john@example.com", "password": "password123" }`
- **Login:** `POST /api/v1/auth/login`
  - _Body (JSON):_ `{ "email": "john@example.com", "password": "password123" }`
  - _Response:_ Returns a JWT `token`. Copy this token.

**To access protected routes:**
Add the token to your HTTP headers as a Bearer token:
`Authorization: Bearer <YOUR_TOKEN_HERE>`

### 2. Interactive REST Docs (Swagger)

Navigate to **`http://localhost:3000/api-docs`** in your browser.
This provides a complete OpenAPI specification. You can click the **"Authorize"** button at the top to paste your JWT, allowing you to test every REST endpoint (Posts, Comments, Chat) directly from the browser.

**Core REST Routes:**

- `GET /api/v1/posts` — Fetch the paginated feed.
- `POST /api/v1/posts` — Create a new post.
- `GET /api/v1/posts/search?q=keyword` — Fuzzy-search posts via Atlas Lucene search.
- `POST /api/v1/messages/:userId` — Send a direct message to a user.
- `POST /api/v1/users/avatar` — Upload a profile picture (Requires `multipart/form-data`).

### 3. GraphQL Sandbox

Navigate to **`http://localhost:3000/graphql`** to access the Apollo Studio Sandbox.
GraphQL is exposed strictly for fetching deeply nested feed data without overfetching.

**Example Query:**
Paste this into the Sandbox to fetch posts with their author details and computed comment counts in a single network request:

```graphql
query GetFeed {
  posts {
    _id
    content
    commentCount
    author {
      name
      avatar
    }
  }
}
```

_(Note: To test protected GraphQL queries, use the 'Headers' tab at the bottom of the Sandbox to add your `Authorization: Bearer <token>` header)._

### 4. Real-Time WebSockets (Socket.io)

Connect your frontend Socket.io client to the root URL (`http://localhost:3000`).

- **Authentication:** Pass your JWT in the connection handshake:
  ```javascript
  const socket = io("http://localhost:3000", { auth: { token: "YOUR_JWT" } });
  ```
- **Events to Emit (Client -> Server):** `send_message`, `typing_start`, `typing_stop`.
- **Events to Listen For (Server -> Client):** `receive_message`, `user_online`, `user_offline`, `new_notification`.

---

## 📊 Performance & Load Testing

_Tested using Autocannon on the `/api/v1/posts` endpoint (Rate limiting temporarily bypassed to test pure DB throughput):_

- **Concurrent Connections:** 50
- **Test Duration:** 10 Seconds
- **Average Throughput:** ~86.3 Req/Sec
- **Average Latency:** 536 ms
- **Observations:** Current throughput is bound by free-tier MongoDB Atlas and Upstash Redis connection limits. At 50 concurrent connections, upstream throttling results in dropped database connections (~30% error rate). In a production environment, scaling the database tier and increasing the Mongoose connection pool size would immediately resolve this bottleneck and multiply throughput.

---

## 🗺️ Roadmap & Future Enhancements

While the core MVP is complete, the following features are deliberately scoped for future iterations:

- **Media Streaming:** Implement HTTP Range requests (status `206 Partial Content`) for scrubbing large video uploads without loading the entire file into memory.
- **Cursor-Based Pagination:** Replace `skip/limit` with indexed cursors for O(1) feed pagination at scale.
- **Dead Letter Queue (DLQ):** Implement a DLQ for BullMQ to catch and manually inspect exhausted background jobs.
- **Stripe Integration:** Add webhook listeners for premium tier subscription management.
