import express from "express";
import { requestOtp, verifyOtp, resendOtp } from "../controllers/authController";

const router = express.Router();

router.post("/request-otp", requestOtp);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);

export default router;
