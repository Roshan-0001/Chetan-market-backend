import { Router } from "express";
import { deleteSingleUser, loginAdmin, logoutAdmin, registerAdmin, viewAllUsers, viewSingleUser, viewAllAdmins, deleteSingleAdmin } from "../controllers/admin.controller.js";
import { verifyAdminJWT, verifyJWT } from "../middlewares/auth.middleware.js";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
const adminRouter = Router();

adminRouter.route("/login-admin").post(loginAdmin);
adminRouter.route("/delete").post(verifyAdminJWT, deleteSingleUser);
adminRouter.route("/delete-admin").post(verifyAdminJWT, deleteSingleAdmin);
adminRouter.route("/view-all-users").post(verifyAdminJWT, viewAllUsers);
adminRouter.route("/view-all-admins").post(verifyAdminJWT, viewAllAdmins);
adminRouter.route("/view-one-user").post(verifyAdminJWT,viewSingleUser);
adminRouter.route("/register-admin").post(verifyAdminJWT,registerAdmin);
adminRouter.route("/register-user").post(verifyAdminJWT,upload.fields([{ name: "profileImage", maxCount: 1 }]),registerUser);
adminRouter.route("/logout-admin").post(verifyAdminJWT,logoutAdmin);

export default adminRouter;