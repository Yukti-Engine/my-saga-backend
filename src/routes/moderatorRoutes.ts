import express from "express";
import { addBoss, addOrganizer, createNewBadge, createCategory, createTournament } from "../controllers/moderatorController.js";
import { authSuperToken } from "../middlewares/auth.js";

const router = express.Router();

router.post("/add-boss", authSuperToken, addBoss);
router.post("/add-organizer", authSuperToken, addOrganizer);
router.post("/create-badge", authSuperToken, createNewBadge);
router.post("/create-category", authSuperToken, createCategory);
router.post("/create-tournament", authSuperToken, createTournament);

export default router;
