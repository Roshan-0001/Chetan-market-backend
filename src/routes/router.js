import { Router } from "express";
import { otpLogin, otpSender, otpVerifier, passwordLogin, registerUser, loginUser, logoutUser } from "../controllers/user.controller.js"
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
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

router.route("/register/send-otp").post(otpSender);
router.route("/register/verify-otp").post(otpVerifier);
router.route("/login/password-login").post(passwordLogin);
router.route("/login/otp-login").post(otpLogin);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT,logoutUser);
router.route("/login/otp-login/send-otp").post(otpSender);
router.route("/login/otp-login/verify-otp").post(otpVerifier);

export default router;

