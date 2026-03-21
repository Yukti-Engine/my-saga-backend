import express from "express";
import { addBoss, addOrganizer, createNewBadge, createCategory } from "../controllers/moderatorController.js";
import { authSuperToken } from "../middlewares/auth.js";

const router = express.Router();

router.post("/add-boss", authSuperToken, addBoss);
router.post("/add-organizer", authSuperToken, addOrganizer);
router.post("/create-badge", authSuperToken, createNewBadge);
router.post("/create-category", authSuperToken, createCategory);

export default router;
