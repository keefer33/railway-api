import type { Request, Response } from "express";
import { railwayQuery, RailwayApiError } from "../../lib/railway.js";

const VARIABLES_QUERY = `
  query ServiceVariables(
    $projectId: String!
    $environmentId: String!
    $serviceId: String
  ) {
    variables(
      projectId: $projectId
      environmentId: $environmentId
      serviceId: $serviceId
    )
  }
`;

const VARIABLE_COLLECTION_UPSERT_MUTATION = `
  mutation VariableCollectionUpsert($input: VariableCollectionUpsertInput!) {
    variableCollectionUpsert(input: $input)
  }
`;

type VariablesResponse = {
  variables: Record<string, string> | null;
};

type UpsertResponse = {
  variableCollectionUpsert: boolean;
};

/**
 * GET /railway/projects/:projectId/services/:serviceId/variables?environmentId=
 */
export async function getServiceVariables(req: Request, res: Response): Promise<void> {
  try {
    const projectId = req.params.projectId?.trim();
    const serviceId = req.params.serviceId?.trim();
    const environmentId =
      typeof req.query.environmentId === "string" ? req.query.environmentId.trim() : "";

    if (!projectId) {
      res.status(400).json({ error: "Missing project id" });
      return;
    }
    if (!serviceId) {
      res.status(400).json({ error: "Missing service id" });
      return;
    }
    if (!environmentId) {
      res.status(400).json({ error: "Missing environmentId query param" });
      return;
    }

    const data = await railwayQuery<VariablesResponse>(VARIABLES_QUERY, {
      projectId,
      environmentId,
      serviceId,
    });

    res.json({
      variables: data.variables ?? {},
      projectId,
      environmentId,
      serviceId,
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
      err instanceof Error ? err.message : "Failed to fetch service variables";
    res.status(500).json({ error: message });
  }
}

/**
 * POST /railway/projects/:projectId/services/:serviceId/variables
 * Body: { environmentId: string, variables: Record<string, string>, skipDeploys?: boolean }
 */
export async function upsertServiceVariables(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const projectId = req.params.projectId?.trim();
    const serviceId = req.params.serviceId?.trim();
    const environmentId =
      typeof req.body?.environmentId === "string" ? req.body.environmentId.trim() : "";
    const variables = req.body?.variables;
    const skipDeploys = Boolean(req.body?.skipDeploys);

    if (!projectId) {
      res.status(400).json({ error: "Missing project id" });
      return;
    }
    if (!serviceId) {
      res.status(400).json({ error: "Missing service id" });
      return;
    }
    if (!environmentId) {
      res.status(400).json({ error: "Missing required field: environmentId" });
      return;
    }
    if (
      variables === undefined ||
      variables === null ||
      typeof variables !== "object" ||
      Array.isArray(variables)
    ) {
      res.status(400).json({
        error: "Missing or invalid required field: variables (object of key/value strings)",
      });
      return;
    }

    const normalized: Record<string, string> = {};
    for (const [key, value] of Object.entries(variables as Record<string, unknown>)) {
      const name = key.trim();
      if (!name) continue;
      normalized[name] = value == null ? "" : String(value);
    }

    const data = await railwayQuery<UpsertResponse>(VARIABLE_COLLECTION_UPSERT_MUTATION, {
      input: {
        projectId,
        environmentId,
        serviceId,
        variables: normalized,
        skipDeploys,
        replace: Boolean(req.body?.replace),
      },
    });

    res.json({
      success: Boolean(data.variableCollectionUpsert),
      variables: normalized,
      projectId,
      environmentId,
      serviceId,
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
      err instanceof Error ? err.message : "Failed to upsert service variables";
    res.status(500).json({ error: message });
  }
}
