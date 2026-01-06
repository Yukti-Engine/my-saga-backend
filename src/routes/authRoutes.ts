import express from "express";
import { signupRequestOtp, signupVerifyOtp, loginRequestOtp,loginVerifyOtp, signupResendOtp, loginResendOtp } from "../controllers/authController.js";

const router = express.Router();

router.post("/signup-request-otp", signupRequestOtp);
router.post("/signup-verify-otp", signupVerifyOtp);
router.post("/signup-resend-otp", signupResendOtp);

router.post("/login-request-otp", loginRequestOtp);
router.post("/login-verify-otp", loginVerifyOtp);
router.post("/login-resend-otp", loginResendOtp);

export default router;
