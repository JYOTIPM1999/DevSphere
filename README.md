# DevSphere Backend 🚀

A production-grade, full-stack social platform backend built with Node.js, Express, and MongoDB. Designed with a focus on security, CI/CD best practices, and real-time performance.

## 🌟 Key Features

- **Dual API Architecture:** RESTful endpoints for standard CRUD + a GraphQL API for optimized frontend fetching.
- **Real-time Infrastructure:** Socket.io for live chat/typing indicators, heavily optimized with Redis presence tracking.
- **Background Processing:** BullMQ & Redis queues for non-blocking email delivery and digest cron jobs.
- **Enterprise Security:** Helmet, Express-Mongo-Sanitize, robust per-route Rate Limiting, and JWT + Refresh Token rotation.
- **Advanced Search:** MongoDB Atlas Search (Lucene) for typo-tolerant, relevance-ranked querying.

## 🏗️ Architecture & Tech Stack

- **Core:** Node.js (ES Modules), Express, MongoDB (Mongoose)
- **Caching & Queues:** Redis (Upstash), BullMQ
- **Real-time & Push:** Socket.io, Web Push
- **Testing & CI/CD:** Jest, Supertest, GitHub Actions (Automated testing & deployments to Render)

## 🐳 Quick Start (Docker)

The easiest way to run DevSphere locally is using Docker. This spins up the Node.js API, a local Redis instance (for background queues and socket presence), and a local MongoDB instance.

1. Clone the repo: `git clone https://github.com/your-username/DevSphere.git`
2. Create your environment file: `cp .env.example .env` (Add your JWT/Cloudinary secrets)
3. Boot the infrastructure: `docker-compose up --build -d`
4. Seed the database: `docker-compose exec app npm run seed`

The REST API will be available at `http://localhost:3000`, the GraphQL sandbox at `http://localhost:3000/graphql`, and the OpenAPI docs at `http://localhost:3000/api-docs`.

## 📊 Performance & Load Testing

_Tested using Autocannon on the `/api/v1/posts` endpoint (Rate limiting temporarily bypassed to test DB throughput):_

- **Concurrent Connections:** 50
- **Average Throughput:** ~86 Req/Sec
- **Average Latency:** 536 ms
- **Observations:** Throughput is currently bound by free-tier MongoDB Atlas / Upstash Redis connection limits. At 50 concurrent connections, upstream throttling results in dropped connections (~30% error rate). In a production environment, scaling the database tier and increasing the Mongoose connection pool size would immediately resolve this bottleneck.

## 🗺️ Roadmap

- Migrating the messaging module to GraphQL
- Implementing cursor-based pagination for the feed
