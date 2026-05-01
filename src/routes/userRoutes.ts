/**
 * userRoutes.ts
 *
 * Routes for authenticated MySaga users.
 * All routes require a valid user access token via authUser.
 */
import express from "express";
import { updateUserProfile, getUserDashboard, joinAdventure, logOut, currentLobby, getAdventures, getPastAdventures, getUserQualifications, reportOrganizer, startBook, renameBook, proceedStory, regenerateStory, concludeChapter, getThemes, getBook, acceptLegal } from "../controllers/userController.js";
import { authUser, requireLegalAcceptance } from "../middlewares/auth.js";

const router = express.Router();
// Authenticate every request on this router
router.use(authUser);
// accept-legal is registered BEFORE requireLegalAcceptance so users can accept new legal
// versions without being blocked by the very check they are trying to satisfy
router.post("/accept-legal", acceptLegal);
// All subsequent routes require up-to-date legal acceptance
router.use(requireLegalAcceptance("user"));

router.post("/update-profile", updateUserProfile);
router.post("/dashboard", getUserDashboard);
router.post("/match", joinAdventure);
router.post("/logout", logOut);
router.post("/lobby", currentLobby);
router.post("/current-adventures", getAdventures);
router.post("/past-adventures", getPastAdventures);
router.post("/qualifications", getUserQualifications);
router.post("/report-organizer", reportOrganizer);
router.post("/start-book", startBook);
router.post("/rename-book", renameBook);
router.post("/proceed", proceedStory);
router.post("/regenerate", regenerateStory);
router.post("/conclude-chapter", concludeChapter);
router.post("/themes", getThemes);
router.post("/book", getBook);
export default router;
