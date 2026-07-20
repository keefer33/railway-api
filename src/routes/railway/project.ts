import type { Request, Response } from "express";
import { railwayQuery, RailwayApiError } from "../../lib/railway.js";

const PROJECT_QUERY = `
  query Project($id: String!, $first: Int) {
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
            name
          }
        }
      }
      groups(first: $first) {
        edges {
          node {
            groupId
            id
            name
            color
            icon
          }
        }
      }
      services(first: $first) {
        edges {
          node {
            createdAt
            id
            name
            templateId
            templateServiceId
            templateThreadSlug
            groupId
            icon
            deployments(first: 1) {
              edges {
                node {
                  id
                  status
                  suggestAddServiceDomain
                  staticUrl
                  instances {
                    id
                    status
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export type ProjectEnvironment = {
  id: string;
  name: string | null;
};

export type ProjectGroup = {
  groupId: string | null;
  id: string;
  name: string | null;
  color: string | null;
  icon: string | null;
};

export type DeploymentInstance = {
  id: string;
  status: string | null;
};

export type ProjectDeployment = {
  id: string;
  status: string | null;
  suggestAddServiceDomain: boolean | null;
  staticUrl: string | null;
  instances: DeploymentInstance[];
};

export type ProjectService = {
  createdAt: string | null;
  id: string;
  name: string | null;
  templateId: string | null;
  templateServiceId: string | null;
  templateThreadSlug: string | null;
  groupId: string | null;
  icon: string | null;
  deployments: {
    edges: Array<{ node: ProjectDeployment }>;
  };
};

export type RailwayProject = {
  id: string;
  name: string | null;
  description: string | null;
  createdAt: string | null;
  deletedAt: string | null;
  environments: {
    edges: Array<{ node: ProjectEnvironment }>;
  };
  groups: {
    edges: Array<{ node: ProjectGroup }>;
  };
  services: {
    edges: Array<{ node: ProjectService }>;
  };
};

type ProjectResponse = {
  project: RailwayProject | null;
};

function mapService(service: ProjectService) {
  const latestDeployment = service.deployments?.edges?.[0]?.node ?? null;
  return {
    createdAt: service.createdAt,
    id: service.id,
    name: service.name,
    templateId: service.templateId,
    templateServiceId: service.templateServiceId,
    templateThreadSlug: service.templateThreadSlug,
    groupId: service.groupId,
    icon: service.icon,
    deployments: service.deployments,
    latestDeployment,
  };
}

/** Fetch a Railway project by id (with environments, groups, and services). */
export async function getProject(req: Request, res: Response): Promise<void> {
  try {
    const projectId = req.params.projectId?.trim();
    if (!projectId) {
      res.status(400).json({ error: "Missing project id" });
      return;
    }

    const first = Math.min(Math.max(Number(req.query.first) || 10, 1), 100);
    const data = await railwayQuery<ProjectResponse>(PROJECT_QUERY, {
      id: projectId,
      first,
    });

    if (!data.project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const project = data.project;
    res.json({
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        createdAt: project.createdAt,
        deletedAt: project.deletedAt,
        environments: project.environments.edges.map((edge) => edge.node),
        groups: project.groups.edges.map((edge) => edge.node),
        services: project.services.edges.map((edge) => mapService(edge.node)),
      },
    });
  } catch (err) {
    if (err instanceof RailwayApiError) {
      res.status(err.status).json({
        error: err.message,
        errors: err.errors,
      });
      return;
    }

    const message = err instanceof Error ? err.message : "Failed to fetch project";
    res.status(500).json({ error: message });
  }
}
