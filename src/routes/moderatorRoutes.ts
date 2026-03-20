import express from "express";
import { addBoss, addOrganizer } from "../controllers/moderatorController.js";
import { authSuperToken } from "../middlewares/auth.js";

const router = express.Router();

router.post("/add-boss", authSuperToken, addBoss);
router.post("/add-organizer", authSuperToken, addOrganizer);

export default router;
