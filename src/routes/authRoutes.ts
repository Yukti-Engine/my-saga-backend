import express from "express";
import { signupRequestOtp, signupVerifyOtp, signupResendOtp, loginRequestOtp,loginVerifyOtp, loginResendOtp } from "../controllers/authController.js";
//import later login
const router = express.Router();

router.post("/signup-request-otp", signupRequestOtp);
router.post("/signup-verify-otp", signupVerifyOtp);
router.post("/signup-resend-otp", signupResendOtp);

router.post("/login-request-otp", loginRequestOtp);
router.post("/login-verify-otp", loginVerifyOtp);
router.post("/login-resend-otp", loginResendOtp);

export default router;
