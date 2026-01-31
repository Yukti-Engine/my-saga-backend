import express from "express";
import { updateUserProfile, getUserDashboard, requestMatch, joinAdventure } from "../controllers/userController.js";
const router = express.Router();
router.post("/update-profile", updateUserProfile);
router.post("/dashboard", getUserDashboard);
router.post("/find-adventures", requestMatch);
router.post("/match", joinAdventure);
export default router;
//# sourceMappingURL=userRoutes.js.map