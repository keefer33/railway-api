import type { Request, Response } from "express";
import { railwayQuery, RailwayApiError } from "../../lib/railway.js";

const SERVICE_DELETE_MUTATION = `
  mutation ServiceDelete($id: String!, $environmentId: String!) {
    serviceDelete(id: $id, environmentId: $environmentId)
  }
`;

type ServiceDeleteResponse = {
  serviceDelete: boolean;
};

/**
 * Delete a Railway service in an environment.
 * POST /railway/projects/:projectId/services/:serviceId/delete
 * Body: { environmentId: string }
 */
export async function serviceDelete(req: Request, res: Response): Promise<void> {
  try {
    const serviceId = req.params.serviceId?.trim();
    const environmentId =
      typeof req.body?.environmentId === "string" ? req.body.environmentId.trim() : "";

    if (!serviceId) {
      res.status(400).json({ error: "Missing service id" });
      return;
    }
    if (!environmentId) {
      res.status(400).json({ error: "Missing required field: environmentId" });
      return;
    }

    const data = await railwayQuery<ServiceDeleteResponse>(SERVICE_DELETE_MUTATION, {
      id: serviceId,
      environmentId,
    });

    if (data.serviceDelete !== true) {
      res.status(502).json({ error: "Railway serviceDelete returned no success result" });
      return;
    }

    res.json({
      deleted: true,
      serviceId,
      environmentId,
    });
  } catch (err) {
    if (err instanceof RailwayApiError) {
      res.status(err.status).json({
        error: err.message,
        errors: err.errors,
      });
      return;
    }

    const message = err instanceof Error ? err.message : "Failed to delete service";
    res.status(500).json({ error: message });
  }
}
