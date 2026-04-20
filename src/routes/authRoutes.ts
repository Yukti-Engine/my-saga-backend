import express from "express";
import rateLimit from "express-rate-limit";
import { signupRequestOtp, signupVerifyOtp, loginRequestOtp,loginVerifyOtp, signupResendOtp, loginResendOtp, organizerLogin, bossLogin, organizerJoinRequest, signupViaLink, getKycUploadUrlForSignup } from "../controllers/authController.js";
import { verifyRecaptcha } from "../middlewares/auth.js";

const router = express.Router();

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many login attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/signup-request-otp", otpLimiter, verifyRecaptcha, signupRequestOtp);
router.post("/signup-verify-otp", otpLimiter, signupVerifyOtp);
router.post("/signup-resend-otp", otpLimiter, signupResendOtp);
router.post("/organizer-login", loginLimiter, organizerLogin);
router.post("/boss-login", loginLimiter, bossLogin);
router.post("/login-request-otp", otpLimiter, loginRequestOtp);
router.post("/login-verify-otp", otpLimiter, loginVerifyOtp);
router.post("/login-resend-otp", otpLimiter, loginResendOtp);
router.post("/organizer-join-request", otpLimiter, verifyRecaptcha, organizerJoinRequest);
router.post("/signup-via-link", loginLimiter, verifyRecaptcha, signupViaLink);
router.post("/kyc-upload-url", otpLimiter, getKycUploadUrlForSignup);

export default router;
