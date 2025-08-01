import { Router } from "express";
import { registerUser, loginUser, logoutUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { viewAllUsers } from "../controllers/admin.controller.js" 

const router = Router();



router.route("/").get(
    (req, res) => {
        res.json({ message: 'Hello from the backend!' });
    }
);

router.route("/register").post(
    upload.fields([
        { name: "profileImage", maxCount: 1 }
    ]),
    registerUser
);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT,logoutUser);
router.route("/view-all-user").post(viewAllUsers);

export default router;

