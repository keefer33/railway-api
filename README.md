# railway-api

Express + TypeScript backend that proxies the [Railway GraphQL API](https://docs.railway.com/integrations/api) and ties projects to authenticated Supabase users.

## Features

- Supabase JWT auth on Railway routes
- Templates: list recommended, search, detail, deploy
- Projects: list (user-owned), create, detail, environments
- Deployments: stop, restart, redeploy

## Getting started

### Requirements

- Node.js 20+
- A Supabase project (for auth)
- A Railway account token and workspace id

### Install

```bash
npm install
```

### Environment

Copy `.env` and fill in values:

| Variable | Description |
| --- | --- |
| `PORT` | HTTP port (default `3000`) |
| `CORS_ORIGIN` | Allowed origin for the frontend (e.g. `http://localhost:5173`) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (anon) key |
| `RAILWAY_TOKEN` | Railway API token from [account tokens](https://railway.com/account/tokens) |
| `WORKSPACE_ID` | Railway workspace id used for template deploys / project create |

### Development

```bash
npm run dev
```

API listens at `http://localhost:3000` (or `PORT`).

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start with `tsx` watch |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run production build (`node dist/index.js`) |
| `npm run typecheck` | Typecheck without emit |

## Auth

Protected routes expect:

```http
Authorization: Bearer <supabase_access_token>
```

The middleware validates the token with Supabase and attaches `user` / `accessToken` to the request.

## API

Public:

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/health` | Health check |
| `GET` | `/auth/healthy` | Auth + Supabase connectivity check |

Railway (all require Bearer auth), mounted at `/railway`:

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/railway/templates` | Recommended templates |
| `GET` | `/railway/templates/search` | Search templates |
| `GET` | `/railway/templates/:templateId` | Template detail |
| `POST` | `/railway/templates/deploy` | Deploy a template into a project |
| `GET` | `/railway/projects` | Current user's projects |
| `POST` | `/railway/projects/create` | Create a Railway project + store ownership |
| `GET` | `/railway/projects/:projectId` | Project detail (envs, groups, services, deployments) |
| `GET` | `/railway/projects/:projectId/environments` | Project environments |
| `POST` | `/railway/deployments/:deploymentId/:action` | `stop` \| `restart` \| `redeploy` |

## Docker

```bash
docker build -t railway-api .

docker run -p 3000:3000 \
  -e PORT=3000 \
  -e CORS_ORIGIN=https://your-app.example \
  -e SUPABASE_URL=... \
  -e SUPABASE_PUBLISHABLE_KEY=... \
  -e RAILWAY_TOKEN=... \
  -e WORKSPACE_ID=... \
  railway-api
```

Secrets should be passed at runtime (or via your host’s env), not baked into the image.
