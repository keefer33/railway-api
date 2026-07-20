import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { railwayQuery, RailwayApiError } from "../../lib/railway.js";
import { createUserClient } from "../../lib/supabase.js";

const PROJECT_CREATE_MUTATION = `
  mutation ProjectCreate($input: ProjectCreateInput!) {
    projectCreate(input: $input) {
      id
      name
      description
    }
  }
`;

type ProjectCreateResponse = {
  projectCreate: {
    id: string;
    name: string;
    description: string | null;
  };
};

/**
 * Create a Railway project, then store it in user_projects.
 * Body: { name: string, description?: string }
 */
export async function projectsCreate(req: Request, res: Response): Promise<void> {
  const { user, accessToken } = req as AuthenticatedRequest;

  try {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const description =
      typeof req.body?.description === "string" ? req.body.description.trim() : "";

    if (!name) {
      res.status(400).json({ error: "Missing required field: name" });
      return;
    }

    const data = await railwayQuery<ProjectCreateResponse>(PROJECT_CREATE_MUTATION, {
      input: {
        name,
        ...(description ? { description } : {}),
        workspaceId: process.env.WORKSPACE_ID,
      },
    });

    const project = data.projectCreate;
    if (!project?.id) {
      res.status(502).json({ error: "Railway projectCreate returned no project" });
      return;
    }

    const supabase = createUserClient(accessToken);
    const { data: userProject, error: insertError } = await supabase
      .from("user_projects")
      .insert({
        user_id: user.id,
        project_id: project.id,
        name: project.name,
        description: project.description ?? (description || null),
        metadata: {
          railway: {
            id: project.id,
            name: project.name,
            description: project.description,
          },
        },
      })
      .select()
      .single();

    if (insertError) {
      res.status(500).json({
        error: "Railway project created but failed to save user_projects entry",
        details: insertError.message,
        project,
      });
      return;
    }

    res.status(201).json({
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

    const message = err instanceof Error ? err.message : "Failed to create project";
    res.status(500).json({ error: message });
  }
}
