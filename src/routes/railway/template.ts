import type { Request, Response } from "express";
import { railwayQuery, RailwayApiError } from "../../lib/railway.js";

const TEMPLATE_QUERY = `
  query Template($id: String) {
    template(id: $id) {
      category
      code
      description
      guides {
        post
        video
      }
      health
      id
      image
      isApproved
      isVerified
      name
      readme
      serializedConfig
      status
      tags
    }
  }
`;

export type TemplateDetail = {
  category: string | null;
  code: string | null;
  description: string | null;
  guides: {
    post: string | null;
    video: string | null;
  } | null;
  health: number | null;
  id: string;
  image: string | null;
  isApproved: boolean | null;
  isVerified: boolean | null;
  name: string | null;
  readme: string | null;
  serializedConfig: unknown;
  status: string | null;
  tags: string[] | null;
};

type TemplateResponse = {
  template: TemplateDetail | null;
};

/** Fetch a single Railway template by id. */
export async function getTemplate(req: Request, res: Response): Promise<void> {
  try {
    const templateId = req.params.templateId?.trim();
    if (!templateId) {
      res.status(400).json({ error: "Missing template id" });
      return;
    }

    const data = await railwayQuery<TemplateResponse>(TEMPLATE_QUERY, {
      id: templateId,
    });

    if (!data.template) {
      res.status(404).json({ error: "Template not found" });
      return;
    }

    res.json({ template: data.template });
  } catch (err) {
    if (err instanceof RailwayApiError) {
      res.status(err.status).json({
        error: err.message,
        errors: err.errors,
      });
      return;
    }

    const message = err instanceof Error ? err.message : "Failed to fetch template";
    res.status(500).json({ error: message });
  }
}
