const RAILWAY_API_URL = "https://backboard.railway.com/graphql/v2";

export type RailwayGraphQLError = {
  message: string;
  locations?: Array<{ line: number; column: number }>;
  path?: Array<string | number>;
  extensions?: Record<string, unknown>;
};

export class RailwayApiError extends Error {
  status: number;
  errors?: RailwayGraphQLError[];

  constructor(message: string, status: number, errors?: RailwayGraphQLError[]) {
    super(message);
    this.name = "RailwayApiError";
    this.status = status;
    this.errors = errors;
  }
}

/**
 * Execute a GraphQL query against the Railway Public API.
 * @see https://docs.railway.com/integrations/api
 */
export async function railwayQuery<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const token = process.env.RAILWAY_TOKEN;
  if (!token) {
    throw new RailwayApiError("Missing RAILWAY_TOKEN environment variable", 500);
  }

  const response = await fetch(RAILWAY_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  const body = (await response.json()) as {
    data?: T;
    errors?: RailwayGraphQLError[];
  };

  if (!response.ok) {
    throw new RailwayApiError(
      body.errors?.[0]?.message ?? `Railway API request failed (${response.status})`,
      response.status,
      body.errors
    );
  }

  if (body.errors?.length) {
    throw new RailwayApiError(body.errors[0].message, 502, body.errors);
  }

  if (body.data === undefined) {
    throw new RailwayApiError("Railway API returned no data", 502);
  }

  return body.data;
}
