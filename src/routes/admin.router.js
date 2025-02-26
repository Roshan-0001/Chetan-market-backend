import { Router } from "express";
import { deleteSingleUser, loginAdmin, logoutAdmin, registerAdmin, viewAllUsers, viewSingleUser } from "../controllers/admin.controller.js";
import { verifyAdminJWT } from "../middlewares/auth.middleware.js";

const adminRouter = Router();

adminRouter.route("/delete").post(verifyAdminJWT, deleteSingleUser);
adminRouter.route("/view-all-users").post(verifyAdminJWT, viewAllUsers);
adminRouter.route("/view-one-user").post(verifyAdminJWT,viewSingleUser);
adminRouter.route("/register-admin").post(registerAdmin);
adminRouter.route("/login-admin").post(loginAdmin);
adminRouter.route("/logout-admin").post(verifyAdminJWT,logoutAdmin);

export default adminRouter;