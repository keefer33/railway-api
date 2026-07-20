import type { Request, Response } from "express";
import { railwayQuery, RailwayApiError } from "../../lib/railway.js";

const PROJECT_ENVIRONMENTS_QUERY = `
  query ProjectEnvironments($id: String!, $first: Int) {
    project(id: $id) {
      environments(first: $first) {
        edges {
          node {
            id
            name
          }
        }
      }
    }
  }
`;

type ProjectEnvironmentsResponse = {
  project: {
    environments: {
      edges: Array<{
        node: {
          id: string;
          name: string | null;
        };
      }>;
    };
  } | null;
};

/** Fetch environments for a Railway project. */
export async function getProjectEnvironments(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const projectId = req.params.projectId?.trim();
    if (!projectId) {
      res.status(400).json({ error: "Missing project id" });
      return;
    }

    const first = Math.min(Math.max(Number(req.query.first) || 10, 1), 100);
    const data = await railwayQuery<ProjectEnvironmentsResponse>(
      PROJECT_ENVIRONMENTS_QUERY,
      {
        id: projectId,
        first,
      }
    );

    if (!data.project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const environments = data.project.environments.edges.map((edge) => edge.node);

    res.json({
      environments,
      count: environments.length,
    });
  } catch (err) {
    if (err instanceof RailwayApiError) {
      res.status(err.status).json({
        error: err.message,
        errors: err.errors,
      });
      return;
    }

    const message =
      err instanceof Error ? err.message : "Failed to fetch project environments";
    res.status(500).json({ error: message });
  }
}
