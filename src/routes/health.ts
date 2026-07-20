import { Router } from "express";

const router = Router();

/** Public health check — no auth required. */
router.get("/health", (_req, res) => {
  res.json({
    status: "healthy",
    service: "railway-api",
    timestamp: new Date().toISOString(),
  });
});

export default router;
