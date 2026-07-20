import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { createUserClient } from "../../lib/supabase.js";

/** List the current user's projects from user_projects. */
export async function getProjects(req: Request, res: Response): Promise<void> {
  const { user, accessToken } = req as AuthenticatedRequest;

  try {
    const supabase = createUserClient(accessToken);
    const { data: projects, error } = await supabase
      .from("user_projects")
      .select("id, created_at, user_id, project_id, name, description, metadata")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({
      projects: projects ?? [],
      count: projects?.length ?? 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list projects";
    res.status(500).json({ error: message });
  }
}
