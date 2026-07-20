import type { Request, Response } from "express";
import { railwayQuery, RailwayApiError } from "../../lib/railway.js";

const ACTIONS = ["stop", "restart", "redeploy"] as const;
type DeploymentAction = (typeof ACTIONS)[number];

const STOP_MUTATION = `
  mutation DeploymentStop($id: String!) {
    deploymentStop(id: $id)
  }
`;

const RESTART_MUTATION = `
  mutation DeploymentRestart($id: String!) {
    deploymentRestart(id: $id)
  }
`;

const REDEPLOY_MUTATION = `
  mutation DeploymentRedeploy($id: String!) {
    deploymentRedeploy(id: $id) {
      id
      status
    }
  }
`;

type StopResponse = { deploymentStop: boolean };
type RestartResponse = { deploymentRestart: boolean };
type RedeployResponse = {
  deploymentRedeploy: {
    id: string;
    status: string | null;
  } | null;
};

function isAction(value: string): value is DeploymentAction {
  return (ACTIONS as readonly string[]).includes(value);
}

/**
 * Run a deployment action (stop | restart | redeploy).
 * POST /railway/deployments/:deploymentId/:action
 */
export async function deploymentAction(req: Request, res: Response): Promise<void> {
  try {
    const deploymentId = req.params.deploymentId?.trim();
    const action = req.params.action?.trim().toLowerCase();

    if (!deploymentId) {
      res.status(400).json({ error: "Missing deployment id" });
      return;
    }
    if (!action || !isAction(action)) {
      res.status(400).json({
        error: `Invalid action. Must be one of: ${ACTIONS.join(", ")}`,
      });
      return;
    }

    if (action === "stop") {
      const data = await railwayQuery<StopResponse>(STOP_MUTATION, {
        id: deploymentId,
      });
      res.json({ action, result: data.deploymentStop });
      return;
    }

    if (action === "restart") {
      const data = await railwayQuery<RestartResponse>(RESTART_MUTATION, {
        id: deploymentId,
      });
      res.json({ action, result: data.deploymentRestart });
      return;
    }

    const data = await railwayQuery<RedeployResponse>(REDEPLOY_MUTATION, {
      id: deploymentId,
    });
    if (!data.deploymentRedeploy) {
      res.status(502).json({ error: "Railway deploymentRedeploy returned no result" });
      return;
    }
    res.json({ action, result: data.deploymentRedeploy });
  } catch (err) {
    if (err instanceof RailwayApiError) {
      res.status(err.status).json({
        error: err.message,
        errors: err.errors,
      });
      return;
    }

    const message =
      err instanceof Error ? err.message : "Failed to run deployment action";
    res.status(500).json({ error: message });
  }
}
