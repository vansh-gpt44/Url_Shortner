import { verifyAccess } from "../utils/tokens.js";
import { AppError } from "../utils/AppError.js";
export function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.accessToken;
    if (!token) throw new Error("missing");
    const claims = verifyAccess(token);
    if (claims.type !== "access") throw new Error("type");
    req.user = { id: claims.sub, email: claims.email };
    next();
  } catch {
    next(new AppError(401, "Please log in", "UNAUTHORIZED"));
  }
}
