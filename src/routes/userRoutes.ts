import express from "express";
import { updateUserProfile, getUserDashboard, requestMatch, joinAdventure, logOut, currentMatchRequest } from "../controllers/userController.js";

const router = express.Router();

router.post("/update-profile", updateUserProfile);
router.post("/dashboard", getUserDashboard);
router.post("/find-adventures", requestMatch);
router.post("/match", joinAdventure);
router.post("/logout", logOut);
router.post("/lobby", currentMatchRequest)

export default router;
