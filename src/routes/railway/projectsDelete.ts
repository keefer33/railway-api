import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { railwayQuery, RailwayApiError } from "../../lib/railway.js";
import { createUserClient } from "../../lib/supabase.js";

const PROJECT_DELETE_MUTATION = `
  mutation ProjectDelete($id: String!) {
    projectDelete(id: $id)
  }
`;

type ProjectDeleteResponse = {
  projectDelete: boolean;
};

/**
 * Delete a Railway project, then remove its user_projects entry.
 * POST /railway/projects/:projectId/delete
 */
export async function projectsDelete(req: Request, res: Response): Promise<void> {
  const { user, accessToken } = req as AuthenticatedRequest;

  try {
    const projectId = req.params.projectId?.trim();
    if (!projectId) {
      res.status(400).json({ error: "Missing project id" });
      return;
    }

    const data = await railwayQuery<ProjectDeleteResponse>(PROJECT_DELETE_MUTATION, {
      id: projectId,
    });

    if (data.projectDelete !== true) {
      res.status(502).json({ error: "Railway projectDelete returned no success result" });
      return;
    }

    const supabase = createUserClient(accessToken);
    const { error: deleteError } = await supabase
      .from("user_projects")
      .delete()
      .eq("user_id", user.id)
      .eq("project_id", projectId);

    if (deleteError) {
      res.status(500).json({
        error: "Railway project deleted but failed to remove user_projects entry",
        details: deleteError.message,
        projectId,
      });
      return;
    }

    res.json({
      deleted: true,
      projectId,
    });
  } catch (err) {
    if (err instanceof RailwayApiError) {
      res.status(err.status).json({
        error: err.message,
        errors: err.errors,
      });
      return;
    }

    const message = err instanceof Error ? err.message : "Failed to delete project";
    res.status(500).json({ error: message });
  }
}
