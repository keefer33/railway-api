import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { getTemplates } from "./templates.js";
import { searchTemplates } from "./templatesSearch.js";
import { getTemplate } from "./template.js";
import { templatesDeploy } from "./templatesDeploy.js";
import { getProjects } from "./projects.js";
import { projectsCreate } from "./projectsCreate.js";
import { projectsDelete } from "./projectsDelete.js";
import { projectsUpdate } from "./projectsUpdate.js";
import { getProject } from "./project.js";
import { getProjectEnvironments } from "./projectEnvironments.js";
import { deploymentAction } from "./deploymentAction.js";
import {
  getServiceVariables,
  upsertServiceVariables,
} from "./serviceVariables.js";
import { serviceDelete } from "./serviceDelete.js";

/**
 * Railway API routes mounted at `/railway`.
 *
 * GET  /railway/templates
 * GET  /railway/templates/search
 * POST /railway/templates/deploy
 * GET  /railway/templates/:templateId
 * GET  /railway/projects
 * POST /railway/projects/create
 * POST /railway/projects/:projectId/update
 * POST /railway/projects/:projectId/delete
 * GET  /railway/projects/:projectId/environments
 * GET  /railway/projects/:projectId/services/:serviceId/variables
 * POST /railway/projects/:projectId/services/:serviceId/variables
 * POST /railway/projects/:projectId/services/:serviceId/delete
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
router.post("/projects/:projectId/update", requireAuth, projectsUpdate);
router.post("/projects/:projectId/delete", requireAuth, projectsDelete);
router.get("/projects/:projectId/environments", requireAuth, getProjectEnvironments);
router.get(
  "/projects/:projectId/services/:serviceId/variables",
  requireAuth,
  getServiceVariables
);
router.post(
  "/projects/:projectId/services/:serviceId/variables",
  requireAuth,
  upsertServiceVariables
);
router.post(
  "/projects/:projectId/services/:serviceId/delete",
  requireAuth,
  serviceDelete
);
router.get("/projects/:projectId", requireAuth, getProject);

router.post("/deployments/:deploymentId/:action", requireAuth, deploymentAction);

export default router;
