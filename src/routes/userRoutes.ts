import express from "express";
import { updateUserProfile, getUserDashboard, requestMatch } from "../controllers/userController.js";

const router = express.Router();

router.post("/update-profile", updateUserProfile);
router.post("/dashboard", getUserDashboard);
router.post("/request-match", requestMatch);

export default router;
