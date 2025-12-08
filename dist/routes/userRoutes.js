import express from "express";
import { updateUserProfile, getUserDashboard } from "../controllers/userController.js";
const router = express.Router();
router.post("/update-profile", updateUserProfile);
router.post("/dashboard", getUserDashboard);
export default router;
//# sourceMappingURL=userRoutes.js.map