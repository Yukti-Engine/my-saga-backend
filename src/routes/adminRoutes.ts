import express from "express";
import type { Request, Response } from "express";
import { authSuperToken } from "../middlewares/auth.js";
import {
  archiveMatchRequests, cleanupExpiredPendingUsers, logoutAbsentees,
  deactivateCompletedAdventures, refreshBadgeRoadmaps, limitMore,
  cleanupExpiredSignupLinks, cleanupStalePendingSignups, cleanupResolvedTickets,
  // Categories
  getCategories, createCategory, updateCategory, deleteCategory, uploadCategoryIconRoute,
  // Badges
  getBadges, createNewBadge, updateBadge, deleteBadge, uploadBadgeIconRoute, getBadgeRoadmaps,
  // Themes
  getThemes, createTheme, updateTheme, deleteTheme, uploadThemeIconRoute,
  // Spaces
  listSpaces, createSpace, updateSpace, deleteSpace, setSpaceCategories, getSpaceCategories,
  // Clone management
  refreshClone,
} from "../controllers/adminController.js";

const router = express.Router();

// ── Maintenance ──
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
  refreshBadgeRoadmaps().catch((err) =>
    console.error("[refresh-badge-roadmaps] Failed:", err.message)
  );
  return res.json({ success: true, message: "Badge roadmap refresh initiated" });
});

router.post("/limit-more", authSuperToken, async (req: Request, res: Response) => {
  const affected = await limitMore();
  return res.json({ success: true, affected });
});

router.post("/cleanup-expired-signup-links", authSuperToken, async (req: Request, res: Response) => {
  const deleted = await cleanupExpiredSignupLinks();
  return res.json({ success: true, deleted });
});

router.post("/cleanup-stale-pending-signups", authSuperToken, async (req: Request, res: Response) => {
  const deleted = await cleanupStalePendingSignups();
  return res.json({ success: true, deleted });
});

router.post("/cleanup-resolved-tickets", authSuperToken, async (req: Request, res: Response) => {
  const deleted = await cleanupResolvedTickets();
  return res.json({ success: true, deleted });
});

// ── Categories ──
router.post("/categories", authSuperToken, getCategories);
router.post("/create-category", authSuperToken, createCategory);
router.post("/update-category", authSuperToken, updateCategory);
router.post("/delete-category", authSuperToken, deleteCategory);
router.post("/upload-category-icon", authSuperToken, uploadCategoryIconRoute);

// ── Badges ──
router.post("/badges", authSuperToken, getBadges);
router.post("/create-badge", authSuperToken, createNewBadge);
router.post("/update-badge", authSuperToken, updateBadge);
router.post("/delete-badge", authSuperToken, deleteBadge);
router.post("/upload-badge-icon", authSuperToken, uploadBadgeIconRoute);
router.post("/badge-roadmaps", authSuperToken, getBadgeRoadmaps);

// ── Themes ──
router.post("/themes", authSuperToken, getThemes);
router.post("/create-theme", authSuperToken, createTheme);
router.post("/update-theme", authSuperToken, updateTheme);
router.post("/delete-theme", authSuperToken, deleteTheme);
router.post("/upload-theme-icon", authSuperToken, uploadThemeIconRoute);

// ── Spaces ──
router.post("/spaces", authSuperToken, listSpaces);
router.post("/create-space", authSuperToken, createSpace);
router.post("/update-space", authSuperToken, updateSpace);
router.post("/delete-space", authSuperToken, deleteSpace);
router.post("/set-space-categories", authSuperToken, setSpaceCategories);
router.post("/get-space-categories", authSuperToken, getSpaceCategories);

// ── Clone management ──
router.post("/refresh-clone", authSuperToken, refreshClone);

export default router;
