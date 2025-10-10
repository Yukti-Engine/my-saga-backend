import express from "express";
import { organiserSignup, bossSignup, organiserLogin, bossLogin, approveOrganiser, approveBoss } from "../controllers/authOrgBossController.js";

const router = express.Router();

router.post("/signup/organiser", organiserSignup);
router.post("/signup/boss", bossSignup);
router.post("/login/organiser", organiserLogin);
router.post("/login/boss", bossLogin);
router.post("/approve/organiser", approveOrganiser);
router.post("/approve/boss", approveBoss);
export default router;
