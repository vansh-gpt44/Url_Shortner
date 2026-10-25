import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as c from "../controllers/authController.js";
const router = Router();
const credentials = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
});
router.post(
  "/register",
  validate(credentials),
  asyncHandler(c.registerController),
);
router.post("/login", validate(credentials), asyncHandler(c.loginController));
router.post("/refresh", asyncHandler(c.refreshController));
router.post("/logout", asyncHandler(c.logoutController));
export default router;
