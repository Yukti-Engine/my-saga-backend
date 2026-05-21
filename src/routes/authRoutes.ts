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
import { signupRequestOtp, signupVerifyOtp, loginRequestOtp,loginVerifyOtp, signupResendOtp, loginResendOtp, organizerLogin, bossLogin, organizerJoinRequest, signupViaLink, getKycUploadUrlForSignup, getLegalVersions, checkSignupLink, getCloneIp } from "../controllers/authController.js";
import { verifyRecaptcha } from "../middlewares/auth.js";

const router = express.Router();

const limiterOpts = { standardHeaders: true, legacyHeaders: false } as const;

// 5 req / 15 min — user signup OTP flow
const signupLimiter = rateLimit({
  ...limiterOpts,
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many signup requests, please try again later." },
});

// 5 req / 15 min — user login OTP flow
const loginOtpLimiter = rateLimit({
  ...limiterOpts,
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many login requests, please try again later." },
});

// 10 req / 15 min — organizer/boss password login
const passwordLoginLimiter = rateLimit({
  ...limiterOpts,
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many login attempts, please try again later." },
});

// 5 req / 15 min — organizer join requests
const joinRequestLimiter = rateLimit({
  ...limiterOpts,
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many join requests, please try again later." },
});

// verifyRecaptcha guards signup/join-request to prevent automated submissions
router.post("/signup-request-otp", signupLimiter, verifyRecaptcha, signupRequestOtp);
router.post("/signup-verify-otp", signupLimiter, signupVerifyOtp);
router.post("/signup-resend-otp", signupLimiter, signupResendOtp);
router.post("/organizer-login", passwordLoginLimiter, organizerLogin);
router.post("/boss-login", passwordLoginLimiter, bossLogin);
router.post("/login-request-otp", loginOtpLimiter, loginRequestOtp);
router.post("/login-verify-otp", loginOtpLimiter, loginVerifyOtp);
router.post("/login-resend-otp", loginOtpLimiter, loginResendOtp);
router.post("/organizer-join-request", joinRequestLimiter, verifyRecaptcha, organizerJoinRequest);
router.post("/signup-via-link", passwordLoginLimiter, signupViaLink);
router.post("/kyc-upload-url", signupLimiter, getKycUploadUrlForSignup);
router.post("/legal-versions", getLegalVersions);
router.post("/check-signup-link", checkSignupLink);
router.post("/clone-ip", getCloneIp);

export default router;
