import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redis } from "../config/redis.js";
// Redis-backed fixed-window limiter. Install rate-limit-redis as a dependency.
export const createLimiter = ({ windowMs, limit, prefix }) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    store: new RedisStore({
      sendCommand: (...args) => redis.call(...args),
      prefix,
    }),
    message: {
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests. Try again later.",
      },
    },
  });
