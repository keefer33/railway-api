import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { railwayQuery, RailwayApiError } from "../../lib/railway.js";
import { createUserClient } from "../../lib/supabase.js";

const PROJECT_SUMMARY_QUERY = `
  query ProjectSummary($id: String!, $first: Int) {
    project(id: $id) {
      id
      name
      description
      createdAt
      deletedAt
      environments(first: $first) {
        edges {
          node {
            id
          }
        }
      }
      groups(first: $first) {
        edges {
          node {
            id
          }
        }
      }
      services(first: $first) {
        edges {
          node {
            id
          }
        }
      }
    }
  }
`;

type ProjectSummaryResponse = {
  project: {
    id: string;
    name: string | null;
    description: string | null;
    createdAt: string | null;
    deletedAt: string | null;
    environments: { edges: Array<{ node: { id: string } }> };
    groups: { edges: Array<{ node: { id: string } }> };
    services: { edges: Array<{ node: { id: string } }> };
  } | null;
};

type UserProjectRow = {
  id: string;
  created_at: string;
  user_id: string;
  project_id: string;
  name: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
};

async function fetchProjectSummary(projectId: string) {
  try {
    const data = await railwayQuery<ProjectSummaryResponse>(PROJECT_SUMMARY_QUERY, {
      id: projectId,
      first: 100,
    });

    const project = data.project;
    if (!project) {
      return {
        serviceCount: 0,
        environmentCount: 0,
        groupCount: 0,
        createdAt: null as string | null,
        deletedAt: null as string | null,
        railwayName: null as string | null,
        railwayDescription: null as string | null,
      };
    }

    return {
      serviceCount: project.services.edges.length,
      environmentCount: project.environments.edges.length,
      groupCount: project.groups.edges.length,
      createdAt: project.createdAt,
      deletedAt: project.deletedAt,
      railwayName: project.name,
      railwayDescription: project.description,
    };
  } catch {
    return {
      serviceCount: 0,
      environmentCount: 0,
      groupCount: 0,
      createdAt: null as string | null,
      deletedAt: null as string | null,
      railwayName: null as string | null,
      railwayDescription: null as string | null,
    };
  }
}

/** List the current user's projects with Railway summary counts. */
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

    const rows = (projects ?? []) as UserProjectRow[];
    const summaries = await Promise.all(
      rows.map((row) => fetchProjectSummary(row.project_id))
    );

    const enriched = rows.map((row, index) => {
      const summary = summaries[index];
      return {
        ...row,
        name: summary.railwayName?.trim() || row.name,
        description: summary.railwayDescription ?? row.description,
        createdAt: summary.createdAt ?? row.created_at,
        deletedAt: summary.deletedAt,
        serviceCount: summary.serviceCount,
        environmentCount: summary.environmentCount,
        groupCount: summary.groupCount,
      };
    });

    res.json({
      projects: enriched,
      count: enriched.length,
    });
  } catch (err) {
    if (err instanceof RailwayApiError) {
      res.status(err.status).json({
        error: err.message,
        errors: err.errors,
      });
      return;
    }

    const message = err instanceof Error ? err.message : "Failed to list projects";
    res.status(500).json({ error: message });
  }
}
