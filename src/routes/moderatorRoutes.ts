import express from "express";
import { addBoss, addOrganizer, createNewBadge, createCategory, createTournament, verifyToken, getUsers, getOrganizers, getBosses, grantGems, grantCredits, getAdventures, getTournaments, getCategories, getBadges, addCategoryQualification, removeCategoryQualification, listKyc, kycDownloadUrl } from "../controllers/moderatorController.js";
import { authSuperToken } from "../middlewares/auth.js";
import { generateSignupLink } from "../controllers/authController.js";

const router = express.Router();

router.post("/verify-token", authSuperToken, verifyToken);
router.post("/users", authSuperToken, getUsers);
router.post("/organizers", authSuperToken, getOrganizers);
router.post("/bosses", authSuperToken, getBosses);
router.post("/grant-gems", authSuperToken, grantGems);
router.post("/grant-credits", authSuperToken, grantCredits);
router.post("/adventures", authSuperToken, getAdventures);
router.post("/tournaments", authSuperToken, getTournaments);
router.post("/categories", authSuperToken, getCategories);
router.post("/badges", authSuperToken, getBadges);
router.post("/add-category-qualification", authSuperToken, addCategoryQualification);
router.post("/remove-category-qualification", authSuperToken, removeCategoryQualification);
router.post("/add-boss", authSuperToken, addBoss);
router.post("/add-organizer", authSuperToken, addOrganizer);
router.post("/create-badge", authSuperToken, createNewBadge);
router.post("/create-category", authSuperToken, createCategory);
router.post("/create-tournament", authSuperToken, createTournament);
router.post("/generate-signup-link", authSuperToken, generateSignupLink);
router.post("/list-kyc", authSuperToken, listKyc);
router.post("/kyc-download-url", authSuperToken, kycDownloadUrl);

export default router;
