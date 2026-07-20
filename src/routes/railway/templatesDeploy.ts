import type { Request, Response } from "express";
import { railwayQuery, RailwayApiError } from "../../lib/railway.js";

const TEMPLATE_DEPLOY_MUTATION = `
  mutation TemplateDeployV2($input: TemplateDeployV2Input!) {
    templateDeployV2(input: $input) {
      projectId
      workflowId
    }
  }
`;

type TemplateDeployResponse = {
  templateDeployV2: {
    projectId: string;
    workflowId: string;
  };
};

/**
 * Deploy a Railway template into a project.
 * Body: {
 *   templateId: string,
 *   projectId: string,
 *   environmentId: string,
 *   serializedConfig: object | string,  // SerializedTemplateConfig JSON
 *   workspaceId?: string                // defaults to WORKSPACE_ID
 * }
 * @see https://backboard.railway.com/schema/template.schema.json
 */
export async function templatesDeploy(req: Request, res: Response): Promise<void> {
  try {
    const templateId =
      typeof req.body?.templateId === "string" ? req.body.templateId.trim() : "";
    const projectId =
      typeof req.body?.projectId === "string" ? req.body.projectId.trim() : "";
    const environmentId =
      typeof req.body?.environmentId === "string" ? req.body.environmentId.trim() : "";
    const workspaceId =
      typeof req.body?.workspaceId === "string" && req.body.workspaceId.trim()
        ? req.body.workspaceId.trim()
        : process.env.WORKSPACE_ID;

    let serializedConfig = req.body?.serializedConfig;
    if (typeof serializedConfig === "string") {
      try {
        serializedConfig = JSON.parse(serializedConfig);
      } catch {
        res.status(400).json({ error: "serializedConfig must be valid JSON" });
        return;
      }
    }

    if (!templateId) {
      res.status(400).json({ error: "Missing required field: templateId" });
      return;
    }
    if (!projectId) {
      res.status(400).json({ error: "Missing required field: projectId" });
      return;
    }
    if (!environmentId) {
      res.status(400).json({ error: "Missing required field: environmentId" });
      return;
    }
    if (!workspaceId) {
      res.status(400).json({ error: "Missing required field: workspaceId" });
      return;
    }
    if (
      serializedConfig === undefined ||
      serializedConfig === null ||
      typeof serializedConfig !== "object"
    ) {
      res.status(400).json({
        error: "Missing or invalid required field: serializedConfig",
      });
      return;
    }

    const data = await railwayQuery<TemplateDeployResponse>(TEMPLATE_DEPLOY_MUTATION, {
      input: {
        templateId,
        projectId,
        environmentId,
        workspaceId,
        serializedConfig,
      },
    });

    const deploy = data.templateDeployV2;
    if (!deploy?.projectId) {
      res.status(502).json({ error: "Railway templateDeployV2 returned no result" });
      return;
    }

    res.status(201).json({ deploy });
  } catch (err) {
    if (err instanceof RailwayApiError) {
      res.status(err.status).json({
        error: err.message,
        errors: err.errors,
      });
      return;
    }

    const message = err instanceof Error ? err.message : "Failed to deploy template";
    res.status(500).json({ error: message });
  }
}
