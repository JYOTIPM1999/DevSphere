# DevSphere API 🚀

A real-time social platform backend built with Node.js, Express, MongoDB, and Socket.io.

## Features Built (MVP Core)

- **Authentication:** Secure JWT flow (15m Access Token) with HTTP-only Refresh Tokens (7d).
- **RESTful CRUD:** Zod-validated post creation, pagination, and ownership checks.
- **Relationships:** Compound indexing for unique Likes and Follows, plus 1:N Comments.
- **File Upload:** Multipart form processing with Multer, streaming directly to Cloudinary.
- **Real-time Chat:** Socket.io integrated with the Express HTTP server, featuring handshake authentication and DB persistence for offline messages.
- **Security:** Helmet headers, Express Rate Limiting, and NoSQL injection sanitization.

## Local Setup

1. Clone the repo and run `npm install`.
2. Copy `.env.example` to `.env` and fill in your MongoDB and Cloudinary credentials.
3. Run `npm run dev` to start the server.

## Roadmap (Planned Features)

Deliberately parked to maintain scope discipline for the MVP sprint:

- Media streaming (range requests)
- Email system (verification/reset/digest)
- Payments (Stripe integration)
- OAuth social login
- Redis caching & Background job queue
- Group chat rooms, typing indicators, and read receipts
