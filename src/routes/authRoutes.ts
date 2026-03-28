import express from "express";
import { signupRequestOtp, signupVerifyOtp, loginRequestOtp,loginVerifyOtp, signupResendOtp, loginResendOtp, organizerLogin, bossLogin, organizerJoinRequest, bossJoinRequest } from "../controllers/authController.js";
import { verifyRecaptcha } from "../middlewares/auth.js";

const router = express.Router();

router.post("/signup-request-otp", verifyRecaptcha, signupRequestOtp);
router.post("/signup-verify-otp", signupVerifyOtp);
router.post("/signup-resend-otp", signupResendOtp);
router.post("/organizer-login", organizerLogin);
router.post("/boss-login", bossLogin);
router.post("/login-request-otp", loginRequestOtp);
router.post("/login-verify-otp", loginVerifyOtp);
router.post("/login-resend-otp", loginResendOtp);
router.post("/organizer-join-request", verifyRecaptcha, organizerJoinRequest);
router.post("/boss-join-request", verifyRecaptcha, bossJoinRequest);

export default router;
