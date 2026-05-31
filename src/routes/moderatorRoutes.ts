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
import { addBoss, addOrganizer, createTournament, verifyToken, getUsers, getOrganizers, getBosses, getAdventures, getTournaments, getLobbies, addCategoryQualification, removeCategoryQualification, addBadgeQualification, removeBadgeQualification, listKyc, kycDownloadUrl, getTickets, resolveTicket, listPendingSignups, getPendingSignupKyc, pendingSignupKycDownloadUrl, approveSignup, rejectSignup } from "../controllers/moderatorController.js";
import { loginModerator, authModeratorSession } from "../middlewares/auth.js";
import { generateSignupLink } from "../controllers/authController.js";

const router = express.Router();

router.post("/login", loginModerator);

router.use(authModeratorSession);

router.post("/verify-token", verifyToken);
router.post("/users", getUsers);
router.post("/organizers", getOrganizers);
router.post("/bosses", getBosses);
router.post("/adventures", getAdventures);
router.post("/tournaments", getTournaments);
router.post("/lobbies", getLobbies);
router.post("/add-category-qualification", addCategoryQualification);
router.post("/remove-category-qualification", removeCategoryQualification);
router.post("/add-badge-qualification", addBadgeQualification);
router.post("/remove-badge-qualification", removeBadgeQualification);
router.post("/add-boss", addBoss);
router.post("/add-organizer", addOrganizer);
router.post("/create-tournament", createTournament);
router.post("/generate-signup-link", generateSignupLink);
router.post("/list-kyc", listKyc);
router.post("/kyc-download-url", kycDownloadUrl);
router.post("/tickets", getTickets);
router.post("/resolve-ticket", resolveTicket);
router.post("/pending-signups", listPendingSignups);
router.post("/pending-signup-kyc", getPendingSignupKyc);
router.post("/pending-signup-kyc-download-url", pendingSignupKycDownloadUrl);
router.post("/approve-signup", approveSignup);
router.post("/reject-signup", rejectSignup);
export default router;
