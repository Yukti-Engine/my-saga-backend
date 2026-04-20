import express from "express";
import type { Request, Response } from "express";
import { authSuperToken } from "../middlewares/auth.js";
import { archiveMatchRequests, cleanupExpiredPendingUsers, logoutAbsentees, deactivateCompletedAdventures, refreshBadgeRoadmaps, limitMore } from "../controllers/adminController.js";

const router = express.Router();

router.post("/archive-match-requests", authSuperToken, async (req: Request, res: Response) => {
  const result = await archiveMatchRequests();
  return res.json({ success: true, archived: result });
});

router.post("/cleanup-expired-pending-users", authSuperToken, async (req: Request, res: Response) => {
  await cleanupExpiredPendingUsers();
  return res.json({ success: true });
});

router.post("/logout-absentees", authSuperToken, async (req: Request, res: Response) => {
  await logoutAbsentees();
  return res.json({ success: true });
});

router.post("/deactivate-completed-adventures", authSuperToken, async (req: Request, res: Response) => {
  const result = await deactivateCompletedAdventures();
  return res.json({ success: true, deactivated: result });
});

router.post("/refresh-badge-roadmaps", authSuperToken, async (req: Request, res: Response) => {
  const result = await refreshBadgeRoadmaps();
  return res.json({ success: true, updated: result });
});

router.post("/limit-more", authSuperToken, async (req: Request, res: Response) => {
  const affected = await limitMore();
  return res.json({ success: true, affected });
});

export default router;
