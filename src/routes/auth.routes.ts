import { Router } from "express";
import { register, login, sendRegisterOTP, sendForgotOTP, resetPassword } from "../controllers/auth.controller";

const router = Router();

router.post("/register/send-otp", sendRegisterOTP);
router.post("/register", register);
router.post("/login", login);

router.post("/forgot-password", sendForgotOTP);
router.post("/reset-password", resetPassword);

export default router;
