import type { Request, Response, NextFunction } from "express";
import type { User } from "@supabase/supabase-js";
import { createAuthClient } from "../lib/supabase.js";

export type AuthenticatedRequest = Request & {
  user: User;
  accessToken: string;
};

/**
 * Verifies the Bearer token from Authorization against Supabase Auth.
 * Attaches `user` and `accessToken` to the request on success.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    res.status(401).json({ error: "Missing access token" });
    return;
  }

  try {
    const supabase = createAuthClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({
        error: error?.message ?? "Invalid or expired token",
      });
      return;
    }

    const authed = req as AuthenticatedRequest;
    authed.user = user;
    authed.accessToken = token;
    next();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Authentication failed";
    res.status(500).json({ error: message });
  }
}
