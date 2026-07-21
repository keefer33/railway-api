import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { railwayQuery, RailwayApiError } from "../../lib/railway.js";
import { createUserClient } from "../../lib/supabase.js";

const PROJECT_UPDATE_MUTATION = `
  mutation ProjectUpdate($id: String!, $input: ProjectUpdateInput!) {
    projectUpdate(id: $id, input: $input) {
      id
      name
      description
    }
  }
`;

type ProjectUpdateResponse = {
  projectUpdate: {
    id: string;
    name: string | null;
    description: string | null;
  } | null;
};

/**
 * Update a Railway project name/description, then sync user_projects.
 * Body: { name: string, description?: string }
 * POST /railway/projects/:projectId/update
 */
export async function projectsUpdate(req: Request, res: Response): Promise<void> {
  const { user, accessToken } = req as AuthenticatedRequest;

  try {
    const projectId = req.params.projectId?.trim();
    if (!projectId) {
      res.status(400).json({ error: "Missing project id" });
      return;
    }

    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const description =
      typeof req.body?.description === "string" ? req.body.description.trim() : "";

    if (!name) {
      res.status(400).json({ error: "Missing required field: name" });
      return;
    }

    const data = await railwayQuery<ProjectUpdateResponse>(PROJECT_UPDATE_MUTATION, {
      id: projectId,
      input: {
        name,
        description: description || null,
      },
    });

    const project = data.projectUpdate;
    if (!project?.id) {
      res.status(502).json({ error: "Railway projectUpdate returned no project" });
      return;
    }

    const supabase = createUserClient(accessToken);
    const { data: userProject, error: updateError } = await supabase
      .from("user_projects")
      .update({
        name: project.name ?? name,
        description: project.description ?? (description || null),
        metadata: {
          railway: {
            id: project.id,
            name: project.name,
            description: project.description,
          },
        },
      })
      .eq("user_id", user.id)
      .eq("project_id", projectId)
      .select()
      .maybeSingle();

    if (updateError) {
      res.status(500).json({
        error: "Railway project updated but failed to sync user_projects entry",
        details: updateError.message,
        project,
      });
      return;
    }

    res.json({
      project,
      userProject,
    });
  } catch (err) {
    if (err instanceof RailwayApiError) {
      res.status(err.status).json({
        error: err.message,
        errors: err.errors,
      });
      return;
    }

    const message = err instanceof Error ? err.message : "Failed to update project";
    res.status(500).json({ error: message });
  }
}
