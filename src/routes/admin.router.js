import { Router } from "express";
import { deleteSingleUser, loginAdmin, logoutAdmin, registerAdmin, viewAllUsers, viewSingleUser } from "../controllers/admin.controller.js";
import { verifyAdminJWT, verifyJWT } from "../middlewares/auth.middleware.js";

const adminRouter = Router();

adminRouter.route("/login-admin").post(loginAdmin);
adminRouter.route("/delete").post(verifyAdminJWT, deleteSingleUser);
adminRouter.route("/view-all-users").post(verifyAdminJWT, viewAllUsers);
adminRouter.route("/view-one-user").post(verifyAdminJWT,viewSingleUser);
adminRouter.route("/register-admin").post(verifyJWT,registerAdmin);
adminRouter.route("/logout-admin").post(verifyAdminJWT,logoutAdmin);

export default adminRouter;