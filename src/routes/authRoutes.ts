/**
 * authRoutes.ts
 *
 * Public routes — no authentication required.
 * Covers: user OTP signup/login, organizer/boss email login,
 * join-request submission, invite-link validation, KYC upload URL generation,
 * and legal version fetching.
 */
import express from "express";
import rateLimit from "express-rate-limit";
import { signupRequestOtp, signupVerifyOtp, loginRequestOtp,loginVerifyOtp, signupResendOtp, loginResendOtp, organizerLogin, bossLogin, organizerJoinRequest, signupViaLink, getKycUploadUrlForSignup, getLegalVersions, checkSignupLink } from "../controllers/authController.js";
import { verifyRecaptcha } from "../middlewares/auth.js";

const router = express.Router();

// Strict limiter for OTP-sending endpoints — 5 requests per 15 min to prevent SMS abuse
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Slightly more lenient limiter for password-based logins
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many login attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// verifyRecaptcha guards signup/join-request to prevent automated submissions
router.post("/signup-request-otp", otpLimiter, verifyRecaptcha, signupRequestOtp);
router.post("/signup-verify-otp", otpLimiter, signupVerifyOtp);
router.post("/signup-resend-otp", otpLimiter, signupResendOtp);
router.post("/organizer-login", loginLimiter, organizerLogin);
router.post("/boss-login", loginLimiter, bossLogin);
router.post("/login-request-otp", otpLimiter, loginRequestOtp);
router.post("/login-verify-otp", otpLimiter, loginVerifyOtp);
router.post("/login-resend-otp", otpLimiter, loginResendOtp);
router.post("/organizer-join-request", otpLimiter, verifyRecaptcha, organizerJoinRequest);
router.post("/signup-via-link", loginLimiter, signupViaLink);
router.post("/kyc-upload-url", otpLimiter, getKycUploadUrlForSignup);
router.post("/legal-versions", getLegalVersions);
router.post("/check-signup-link", checkSignupLink);

export default router;
