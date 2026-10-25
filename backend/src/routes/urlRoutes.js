import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as c from "../controllers/urlController.js";
const router = Router();
const createSchema = z.object({
  originalUrl: z.string().url(),
  alias: z.string().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  password: z.string().min(4).max(128).optional(),
});
const updateSchema = z.object({
  originalUrl: z.string().url().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  password: z.string().min(4).max(128).nullable().optional(),
});
router.use(requireAuth);
router.get("/", asyncHandler(c.list));
router.post("/", validate(createSchema), asyncHandler(c.create));
router.patch("/:id", validate(updateSchema), asyncHandler(c.update));
router.delete("/:id", asyncHandler(c.remove));
router.get("/:id/qr", asyncHandler(c.qr));
router.get("/:id/analytics", asyncHandler(c.getAnalytics));
export default router;
