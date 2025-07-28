import { Router } from "express";
import { body } from "express-validator";
import * as projectController from "../controllers/project.controller.js";
import * as AuthMiddleware from "../middleware/auth.middleware.js";
const router = Router();

router.post(
  "/create",
  AuthMiddleware.authUser,
  body("name").isString().withMessage("Name is required"),
  projectController.createProject
);

router.get("/all", AuthMiddleware.authUser, projectController.getAllProject);

router.put(
  "/add-user",
  AuthMiddleware.authUser,
  body("projectId").isString().withMessage("Project ID is required"),
  body("users")
    .isArray({ min: 1 })
    .withMessage("Users must be an array of strings")
    .bail()
    .custom((users) => users.every((user) => typeof user === "string"))
    .withMessage("Each user must be a string"),
  projectController.addUserToProject
);

router.get(
  "/get-project/:projectId",
  AuthMiddleware.authUser,
  projectController.getProjectById
);

router.put(
  "/update-file-tree",
  AuthMiddleware.authUser,
  body("projectId").isString().withMessage("Project ID is required"),
  body("fileTree").isObject().withMessage("File tree is required"),
  projectController.updateFileTree
);
export default router;
