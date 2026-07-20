import type { Request, Response } from "express";
import { railwayQuery, RailwayApiError } from "../../lib/railway.js";

const TEMPLATE_SEARCH_QUERY = `
  query TemplateSearch(
    $query: String!
    $first: Int
    $after: String
    $category: String
    $verified: Boolean
  ) {
    templateSearch(
      query: $query
      first: $first
      after: $after
      category: $category
      verified: $verified
    ) {
      edges {
        cursor
        node {
          code
          creatorName
          deploymentCount
          description
          healthScore
          id
          image
          isVerified
          name
        }
      }
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
    }
  }
`;

export type TemplateSearchNode = {
  code: string | null;
  creatorName: string | null;
  deploymentCount: number | null;
  description: string | null;
  healthScore: number | null;
  id: string;
  image: string | null;
  isVerified: boolean | null;
  name: string | null;
};

type TemplateSearchResponse = {
  templateSearch: {
    edges: Array<{
      cursor: string;
      node: TemplateSearchNode;
    }>;
    pageInfo: {
      endCursor: string | null;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string | null;
    };
  };
};

/**
 * Search Railway templates.
 * Query params: q (optional, defaults to ""), first, after, category, verified
 */
export async function searchTemplates(req: Request, res: Response): Promise<void> {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

    const first = Math.min(Math.max(Number(req.query.first) || 20, 1), 100);
    const after = typeof req.query.after === "string" ? req.query.after : undefined;
    const category =
      typeof req.query.category === "string" ? req.query.category : undefined;

    let verified: boolean | undefined;
    if (req.query.verified === "true") verified = true;
    else if (req.query.verified === "false") verified = false;

    const data = await railwayQuery<TemplateSearchResponse>(TEMPLATE_SEARCH_QUERY, {
      query: q,
      first,
      after,
      category,
      verified,
    });

    const templates = data.templateSearch.edges.map((edge) => ({
      ...edge.node,
      cursor: edge.cursor,
    }));

    res.json({
      templates,
      count: templates.length,
      pageInfo: data.templateSearch.pageInfo,
    });
  } catch (err) {
    if (err instanceof RailwayApiError) {
      res.status(err.status).json({
        error: err.message,
        errors: err.errors,
      });
      return;
    }

    const message = err instanceof Error ? err.message : "Failed to search templates";
    res.status(500).json({ error: message });
  }
}
