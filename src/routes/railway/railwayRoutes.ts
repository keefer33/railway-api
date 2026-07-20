import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { getTemplates } from "./templates.js";
import { searchTemplates } from "./templatesSearch.js";
import { getTemplate } from "./template.js";
import { templatesDeploy } from "./templatesDeploy.js";
import { getProjects } from "./projects.js";
import { projectsCreate } from "./projectsCreate.js";
import { getProject } from "./project.js";
import { getProjectEnvironments } from "./projectEnvironments.js";
import { deploymentAction } from "./deploymentAction.js";

/**
 * Railway API routes mounted at `/railway`.
 *
 * GET  /railway/templates
 * GET  /railway/templates/search
 * POST /railway/templates/deploy
 * GET  /railway/templates/:templateId
 * GET  /railway/projects
 * POST /railway/projects/create
 * GET  /railway/projects/:projectId/environments
 * GET  /railway/projects/:projectId
 * POST /railway/deployments/:deploymentId/:action  (stop | restart | redeploy)
 */
const router = Router();

// Static `/templates/*` paths must be registered before `/templates/:templateId`
router.get("/templates", requireAuth, getTemplates);
router.get("/templates/search", requireAuth, searchTemplates);
router.post("/templates/deploy", requireAuth, templatesDeploy);
router.get("/templates/:templateId", requireAuth, getTemplate);

// Static `/projects/*` paths must be registered before `/projects/:projectId`
router.get("/projects", requireAuth, getProjects);
router.post("/projects/create", requireAuth, projectsCreate);
router.get("/projects/:projectId/environments", requireAuth, getProjectEnvironments);
router.get("/projects/:projectId", requireAuth, getProject);

router.post("/deployments/:deploymentId/:action", requireAuth, deploymentAction);

export default router;
