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

## 🚀 Quick Start

1. Clone the repo and `npm install`
2. Create a `.env` file (see `.env.example`)
3. `npm run dev`

## 📊 Performance & Load Testing

_Tested using Autocannon on the `/api/v1/posts` endpoint (Rate limiting temporarily bypassed to test DB throughput):_

- **Concurrent Connections:** 50
- **Average Throughput:** ~86 Req/Sec
- **Average Latency:** 536 ms
- **Observations:** Throughput is currently bound by free-tier MongoDB Atlas / Upstash Redis connection limits. At 50 concurrent connections, upstream throttling results in dropped connections (~30% error rate). In a production environment, scaling the database tier and increasing the Mongoose connection pool size would immediately resolve this bottleneck.

## 🗺️ Roadmap

- Migrating the messaging module to GraphQL
- Implementing cursor-based pagination for the feed
