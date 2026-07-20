import type { Request, Response } from "express";
import { railwayQuery, RailwayApiError } from "../../lib/railway.js";

const TEMPLATES_QUERY = `
  query RecommendedTemplates($first: Int) {
    templates(first: $first, recommended: true) {
      edges {
        node {
          id
          category
          code
          health
          name
          description
          image
          isApproved
          isVerified
          tags
          status
          isV2Template
        }
      }
    }
  }
`;

export type TemplateNode = {
  id: string;
  category: string | null;
  code: string | null;
  health: number | null;
  name: string | null;
  description: string | null;
  image: string | null;
  isApproved: boolean | null;
  isVerified: boolean | null;
  tags: string[] | null;
  status: string | null;
  isV2Template: boolean | null;
};

type TemplatesResponse = {
  templates: {
    edges: Array<{ node: TemplateNode }>;
  };
};

/** Lists recommended Railway templates. */
export async function getTemplates(req: Request, res: Response): Promise<void> {
  try {
    const first = Math.min(Math.max(Number(req.query.first) || 20, 1), 100);
    const data = await railwayQuery<TemplatesResponse>(TEMPLATES_QUERY, { first });

    const templates = data.templates.edges.map((edge) => edge.node);

    res.json({
      templates,
      count: templates.length,
    });
  } catch (err) {
    if (err instanceof RailwayApiError) {
      res.status(err.status).json({
        error: err.message,
        errors: err.errors,
      });
      return;
    }

    const message = err instanceof Error ? err.message : "Failed to fetch templates";
    res.status(500).json({ error: message });
  }
}
