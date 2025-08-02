import { Router } from "express";
import * as userContoller from "../controllers/user.controller.js";
import { body } from "express-validator";
import * as AuthMiddleware from "../middleware/auth.middleware.js";
const router = Router();

router.post(
  "/register",
  body("email").isEmail().withMessage("Email must be a valid email address"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must of length greater than 6"),
  userContoller.createUserController
);

router.post(
  "/login",
  body("email").isEmail().withMessage("Email must be a valid email address"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be length greater than 6"),
  userContoller.LoginController
);

router.get(
  "/profile",
  AuthMiddleware.authUser,
  userContoller.profileController
);

router.get(
  "/logout",
  AuthMiddleware.authUser,
  userContoller.logoutController
);

router.get(
  "/all",
  AuthMiddleware.authUser,
  userContoller.getAllUsersController
);
export default router;
