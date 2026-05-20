/**
 * moderatorRoutes.ts
 *
 * Internal moderation routes — every endpoint is protected by authSuperToken.
 * Covers: user/organizer/boss management, qualifications, KYC review,
 * pending-signup workflow, ticket resolution, tournaments, and adventures.
 *
 * Category/badge/theme/space CRUD has moved to adminRoutes.
 */
import express from "express";
import { addBoss, addOrganizer, createTournament, verifyToken, getUsers, getOrganizers, getBosses, grantCredits, getAdventures, getTournaments, addCategoryQualification, removeCategoryQualification, listKyc, kycDownloadUrl, getTickets, resolveTicket, listPendingSignups, getPendingSignupKyc, pendingSignupKycDownloadUrl, approveSignup, rejectSignup } from "../controllers/moderatorController.js";
import { authSuperToken } from "../middlewares/auth.js";
import { generateSignupLink } from "../controllers/authController.js";

const router = express.Router();

router.post("/verify-token", authSuperToken, verifyToken);
router.post("/users", authSuperToken, getUsers);
router.post("/organizers", authSuperToken, getOrganizers);
router.post("/bosses", authSuperToken, getBosses);
router.post("/grant-credits", authSuperToken, grantCredits);
router.post("/adventures", authSuperToken, getAdventures);
router.post("/tournaments", authSuperToken, getTournaments);
router.post("/add-category-qualification", authSuperToken, addCategoryQualification);
router.post("/remove-category-qualification", authSuperToken, removeCategoryQualification);
router.post("/add-boss", authSuperToken, addBoss);
router.post("/add-organizer", authSuperToken, addOrganizer);
router.post("/create-tournament", authSuperToken, createTournament);
router.post("/generate-signup-link", authSuperToken, generateSignupLink);
router.post("/list-kyc", authSuperToken, listKyc);
router.post("/kyc-download-url", authSuperToken, kycDownloadUrl);
router.post("/tickets", authSuperToken, getTickets);
router.post("/resolve-ticket", authSuperToken, resolveTicket);
router.post("/pending-signups", authSuperToken, listPendingSignups);
router.post("/pending-signup-kyc", authSuperToken, getPendingSignupKyc);
router.post("/pending-signup-kyc-download-url", authSuperToken, pendingSignupKycDownloadUrl);
router.post("/approve-signup", authSuperToken, approveSignup);
router.post("/reject-signup", authSuperToken, rejectSignup);
export default router;
