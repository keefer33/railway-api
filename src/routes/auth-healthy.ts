import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

/** Authenticated health check — returns Supabase session/user info. */
router.get("/auth-healthy", requireAuth, (req, res) => {
  const { user, accessToken } = req as AuthenticatedRequest;

  res.json({
    status: "healthy",
    service: "railway-api",
    timestamp: new Date().toISOString(),
    session: {
      access_token: accessToken,
      user,
    },
  });
});

export default router;
