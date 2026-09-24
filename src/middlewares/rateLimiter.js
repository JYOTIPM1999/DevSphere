import rateLimit from "express-rate-limit";

// Standard limit for standard browsing (100 reqs / 15 mins)
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 100,
  max: 100,
  message: {
    success: false,
    error: "Too many requests from this IP, please try again in 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limit for auth routes to prevent credential stuffing (10 reqs / 1 hour)
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 100,
  max: 10,
  message: {
    success: false,
    error: "Too many auth attempts from this IP, please try again in an hour",
  },
});
